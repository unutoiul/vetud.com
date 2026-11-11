import type { AuthenticationInput, MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"

const PROVIDER = "emailpass"

/** The customer's email, which is also their sign-in name with the email-and-password provider. */
async function customerEmail(container: MedusaContainer, customerId: string) {
  const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(customerId)
  if (!customer.email) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This account has no email address.")
  return customer.email
}

/** Checks the password the way signing in does; a wrong one fails with the same message. */
async function assertPassword(container: MedusaContainer, email: string, password: string) {
  const input: AuthenticationInput = { url: "", headers: {}, query: {}, protocol: "https", body: { email, password } }
  const result = await container.resolve(Modules.AUTH).authenticate(PROVIDER, input)
  if (!result.success) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Your current password isn't right.")
}

type ChangePasswordInput = { customer_id: string; current_password: string; new_password: string }

const changePasswordStep = createStep(
  "change-customer-password",
  async (input: ChangePasswordInput, { container }) => {
    const email = await customerEmail(container, input.customer_id)
    await assertPassword(container, email, input.current_password)
    if (input.current_password === input.new_password) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose a password you haven't used here.")
    }
    const result = await container.resolve(Modules.AUTH).updateProvider(PROVIDER, { entity_id: email, password: input.new_password })
    if (!result.success) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "We couldn't change your password. Please try again.")
    return new StepResponse({ changed: true })
  }
)

/** Changes the signed-in member's password after checking the current one. */
export const changeCustomerPasswordWorkflow = createWorkflow(
  "change-customer-password",
  function (input: ChangePasswordInput) {
    return new WorkflowResponse(changePasswordStep(input))
  }
)

type ChangeEmailInput = { customer_id: string; email: string; password: string }
type EmailUndo = { customer_id: string; identity_id: string; previous: string }

const changeEmailStep = createStep(
  "change-customer-email",
  async (input: ChangeEmailInput, { container }) => {
    const customers = container.resolve(Modules.CUSTOMER)
    const auth = container.resolve(Modules.AUTH)
    const previous = await customerEmail(container, input.customer_id)
    const email = input.email.trim().toLowerCase()
    if (email === previous.toLowerCase()) throw new MedusaError(MedusaError.Types.INVALID_DATA, "That's already your email address.")
    await assertPassword(container, previous, input.password)

    // Another account (or sign-in) with the new address would make the change ambiguous.
    const [taken] = await auth.listProviderIdentities({ provider: PROVIDER, entity_id: email }, { take: 1 })
    const [registered] = await customers.listCustomers({ email, has_account: true }, { take: 1 })
    if (taken || registered) throw new MedusaError(MedusaError.Types.DUPLICATE_ERROR, "Another account already uses that email address.")

    const [identity] = await auth.listProviderIdentities({ provider: PROVIDER, entity_id: previous }, { take: 1 })
    if (!identity) throw new MedusaError(MedusaError.Types.NOT_FOUND, "We couldn't find your sign-in details.")

    // The sign-in name and the customer's email change together, so the next sign-in uses the new address.
    await auth.updateProviderIdentities({ id: identity.id, entity_id: email })
    await customers.updateCustomers(input.customer_id, { email })
    return new StepResponse({ email }, { customer_id: input.customer_id, identity_id: identity.id, previous } satisfies EmailUndo)
  },
  async (undo: EmailUndo | undefined, { container }) => {
    if (!undo) return
    await container.resolve(Modules.AUTH).updateProviderIdentities({ id: undo.identity_id, entity_id: undo.previous })
    await container.resolve(Modules.CUSTOMER).updateCustomers(undo.customer_id, { email: undo.previous })
  }
)

/** Changes the signed-in member's email (their sign-in name too) after checking their password. */
export const changeCustomerEmailWorkflow = createWorkflow(
  "change-customer-email",
  function (input: ChangeEmailInput) {
    return new WorkflowResponse(changeEmailStep(input))
  }
)
