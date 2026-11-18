import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateCartWorkflow } from "@medusajs/medusa/core-flows"
import { emailNeedsSignIn, memberIdsForEmail } from "../lib/checkout-email"

export type SetCheckoutEmailInput = {
  cart_id: string
  email: string
  /** The signed-in shopper, from the request's authentication; never from the body. */
  customer_id?: string | null
}

export type SetCheckoutEmailResult = { account_exists: boolean }

/** Whether a member account other than the shopper's own uses this email. Reads only. */
const checkCheckoutEmailStep = createStep(
  "check-checkout-email",
  async (input: SetCheckoutEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const memberIds = await memberIdsForEmail(query, input.email)
    return new StepResponse<SetCheckoutEmailResult>({ account_exists: emailNeedsSignIn(memberIds, input.customer_id) })
  }
)

/**
 * The guest checkout's Contact step. When the email belongs to a member account, nothing is saved
 * and the storefront asks the shopper to sign in; otherwise the email is saved through Medusa's
 * own cart update (which also starts the owner's guest-checkout alert).
 */
export const setCheckoutEmailWorkflow = createWorkflow(
  "set-checkout-email",
  function (input: SetCheckoutEmailInput) {
    const check = checkCheckoutEmailStep(input)
    when("checkout-email-is-free", { check }, ({ check }) => !check.account_exists).then(() => {
      updateCartWorkflow.runAsStep({ input: transform({ input }, ({ input }) => ({ id: input.cart_id, email: input.email.trim() })) })
    })
    return new WorkflowResponse(check)
  }
)
