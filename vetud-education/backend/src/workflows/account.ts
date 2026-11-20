import type { CreateNotificationDTO, MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  checkSignInCode,
  issueSignInCode,
  normalizeEmail,
  secondsUntilResend,
  SIGN_IN_CODE_ERRORS,
  SIGN_IN_CODE_RESEND_SECONDS,
  SIGN_IN_CODE_TTL_MINUTES,
  SIGN_IN_PROVIDER,
  type SignInCodeState,
} from "../lib/sign-in-code"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

/**
 * Members have no passwords (owner, 2026-11-19), so changing the email they sign in with is proved
 * with a code sent to the new address. The pending change is kept on the member's own sign-in
 * login, next to its sign-in code.
 */
type PendingEmail = { pending_email?: string | null; pending?: SignInCodeState | null }
type LoginState = SignInCodeState & PendingEmail

/** The customer's email, which is also the address their code login uses. */
async function customerEmail(container: MedusaContainer, customerId: string) {
  const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(customerId)
  if (!customer.email) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This account has no email address.")
  return normalizeEmail(customer.email)
}

/** The member's code login, made (and tied to them) if they don't have one yet. */
async function memberLogin(container: MedusaContainer, customerId: string, email: string) {
  const auth = container.resolve(Modules.AUTH)
  const [login] = await auth.listProviderIdentities({ provider: SIGN_IN_PROVIDER, entity_id: email }, { relations: ["auth_identity"] })
  if (login) {
    const owner = login.auth_identity?.app_metadata?.customer_id
    if (owner && owner !== customerId) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "We couldn't find your sign-in details.")
    return login
  }
  const created = await auth.createAuthIdentities({ provider_identities: [{ provider: SIGN_IN_PROVIDER, entity_id: email }], app_metadata: { customer_id: customerId } })
  return created.provider_identities!.find((provider) => provider.provider === SIGN_IN_PROVIDER)!
}

/** The new address must not belong to another account. A code login nobody finished is cleared. */
async function assertEmailFree(container: MedusaContainer, email: string) {
  const auth = container.resolve(Modules.AUTH)
  const [registered] = await container.resolve(Modules.CUSTOMER).listCustomers({ email, has_account: true }, { take: 1 })
  const [login] = await auth.listProviderIdentities({ provider: SIGN_IN_PROVIDER, entity_id: email }, { relations: ["auth_identity"] })
  if (registered || login?.auth_identity?.app_metadata?.customer_id) {
    throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "Another account already uses that email address.")
  }
  return login
}

type RequestInput = { customer_id: string; email: string }

const prepareEmailChangeCodeStep = createStep(
  "prepare-email-change-code",
  async (input: RequestInput, { container }) => {
    const previous = await customerEmail(container, input.customer_id)
    const email = normalizeEmail(input.email)
    if (email === previous) throw new MedusaError(MedusaError.Types.INVALID_DATA, "That's already your email address.")
    await assertEmailFree(container, email)
    const login = await memberLogin(container, input.customer_id, previous)
    const state = (login.provider_metadata ?? {}) as LoginState
    const wait = secondsUntilResend(state.pending_email === email ? state.pending : null)
    if (wait > 0) return new StepResponse({ notification: null as CreateNotificationDTO | null, resend_after: wait })

    // The code is bound to the new address, so it can't confirm a different one.
    const { code, state: pending } = issueSignInCode(`${login.id}:${email}`)
    await container.resolve(Modules.AUTH).updateProviderIdentities({ id: login.id, provider_metadata: { ...state, pending_email: email, pending } })
    const notification: CreateNotificationDTO = {
      to: email,
      channel: "email",
      template: EmailTemplates.EMAIL_CHANGE_CODE,
      data: { code, minutes: SIGN_IN_CODE_TTL_MINUTES },
      trigger_type: "account.email_change_code",
    }
    return new StepResponse({ notification, resend_after: SIGN_IN_CODE_RESEND_SECONDS })
  }
)

/** Emails a code to the member's new address. */
export const requestEmailChangeCodeWorkflow = createWorkflow("request-email-change-code", (input: RequestInput) => {
  const prepared = prepareEmailChangeCodeStep(input)
  sendNotificationStep(transform(prepared, (result) => (result.notification ? [result.notification] : [])))
  return new WorkflowResponse(transform(prepared, (result) => ({ resend_after: result.resend_after })))
})

type ChangeEmailInput = { customer_id: string; email: string; code: string }
type EmailUndo = { customer_id: string; login_id: string; previous: string; state: LoginState }

const changeEmailStep = createStep(
  "change-customer-email",
  async (input: ChangeEmailInput, { container }) => {
    const auth = container.resolve(Modules.AUTH)
    const previous = await customerEmail(container, input.customer_id)
    const email = normalizeEmail(input.email)
    const login = await memberLogin(container, input.customer_id, previous)
    const state = (login.provider_metadata ?? {}) as LoginState
    if (state.pending_email !== email) throw new MedusaError(MedusaError.Types.INVALID_DATA, SIGN_IN_CODE_ERRORS.expired)

    const result = checkSignInCode(state.pending, `${login.id}:${email}`, input.code)
    if (result !== "ok") {
      if (result === "wrong") {
        await auth.updateProviderIdentities({ id: login.id, provider_metadata: { ...state, pending: { ...state.pending, attempts: (state.pending?.attempts ?? 0) + 1 } } })
      }
      throw new MedusaError(MedusaError.Types.INVALID_DATA, SIGN_IN_CODE_ERRORS[result])
    }

    // Checked again now: the address may have been taken since the code was sent.
    const unfinished = await assertEmailFree(container, email)
    if (unfinished) await auth.deleteAuthIdentities([unfinished.auth_identity_id!])

    // The sign-in address and the customer's email change together.
    await auth.updateProviderIdentities({ id: login.id, entity_id: email, provider_metadata: { ...state, pending_email: null, pending: null } })
    await container.resolve(Modules.CUSTOMER).updateCustomers(input.customer_id, { email })
    return new StepResponse({ email }, { customer_id: input.customer_id, login_id: login.id, previous, state } satisfies EmailUndo)
  },
  async (undo: EmailUndo | undefined, { container }) => {
    if (!undo) return
    await container.resolve(Modules.AUTH).updateProviderIdentities({ id: undo.login_id, entity_id: undo.previous, provider_metadata: undo.state })
    await container.resolve(Modules.CUSTOMER).updateCustomers(undo.customer_id, { email: undo.previous })
  }
)

/** Changes the signed-in member's email (their sign-in address too) with the code sent to it. */
export const changeCustomerEmailWorkflow = createWorkflow(
  "change-customer-email",
  function (input: ChangeEmailInput) {
    return new WorkflowResponse(changeEmailStep(input))
  }
)
