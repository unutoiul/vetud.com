import type { CreateNotificationDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { issueSignInCode, normalizeEmail, secondsUntilResend, SIGN_IN_CODE_RESEND_SECONDS, SIGN_IN_CODE_TTL_MINUTES, SIGN_IN_PROVIDER, type SignInCodeState } from "../lib/sign-in-code"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

type Prepared = { notification: CreateNotificationDTO | null; resend_after: number }

/** An exact, case-insensitive match: ILIKE with its wildcards escaped. */
const exactIlike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`)

/**
 * Finds or makes the email's `email-code` login and gives it a new code. A member's login is tied to
 * their account, so the code signs them in to it; anyone else's account is made after the code
 * works. At most one code every 30 seconds per address.
 */
export const prepareSignInCodeStep = createStep(
  "prepare-sign-in-code",
  async (input: { email: string }, { container }) => {
    const email = normalizeEmail(input.email)
    const auth = container.resolve(Modules.AUTH)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: members } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name"],
      filters: { email: { $ilike: exactIlike(email) }, has_account: true },
    })
    const member = members[0] as { id: string; first_name?: string | null } | undefined

    let [login] = await auth.listProviderIdentities({ provider: SIGN_IN_PROVIDER, entity_id: email }, { relations: ["auth_identity"] })
    if (!login) {
      const created = await auth.createAuthIdentities({
        provider_identities: [{ provider: SIGN_IN_PROVIDER, entity_id: email }],
        app_metadata: member ? { customer_id: member.id } : {},
      })
      login = created.provider_identities!.find((provider) => provider.provider === SIGN_IN_PROVIDER)!
    } else if (member && !login.auth_identity?.app_metadata?.customer_id) {
      // The account was made after this login (with a password, before codes): tie them together.
      await auth.updateAuthIdentities({ id: login.auth_identity_id!, app_metadata: { ...(login.auth_identity?.app_metadata ?? {}), customer_id: member.id } })
    }

    const wait = secondsUntilResend(login.provider_metadata as SignInCodeState | null)
    if (wait > 0) return new StepResponse<Prepared>({ notification: null, resend_after: wait })

    const { code, state } = issueSignInCode(login.id)
    await auth.updateProviderIdentities({ id: login.id, provider_metadata: state })
    return new StepResponse<Prepared>({
      notification: {
        to: email,
        channel: "email",
        template: EmailTemplates.SIGN_IN_CODE,
        data: { code, minutes: SIGN_IN_CODE_TTL_MINUTES, first_name: member?.first_name ?? null },
        trigger_type: "auth.sign_in_code",
      },
      resend_after: SIGN_IN_CODE_RESEND_SECONDS,
    })
  }
)

/** Emails a sign-in code. The answer never says whether the address has an account. */
export const requestSignInCodeWorkflow = createWorkflow("request-sign-in-code", (input: { email: string }) => {
  const prepared = prepareSignInCodeStep(input)
  const notifications = transform(prepared, (result) => (result.notification ? [result.notification] : []))
  sendNotificationStep(notifications)
  // `sent` is false while the 30-second limit holds: that says nothing about whether the address has an account.
  return new WorkflowResponse(transform(prepared, (result) => ({ sent: Boolean(result.notification), resend_after: result.resend_after })))
})
