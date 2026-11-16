import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows"
import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { findGuestOrderStep, moveOrderToCustomerStep, type FindGuestOrderInput } from "./steps/guest-order-account"

/**
 * Read-only: which guest order this is and who should get it. The route runs this before it
 * creates a login, so a refused request never leaves an unused login behind.
 */
export const findGuestOrderWorkflow = createWorkflow("find-guest-order", function (input: FindGuestOrderInput) {
  return new WorkflowResponse(findGuestOrderStep(input))
})

type AttachInput = FindGuestOrderInput & {
  /** The login the route just created for a new account (email and password are never passed here). */
  auth_identity_id?: string
}

/**
 * Puts a guest order into an account: the signed-in member's, or a new account for the login the
 * route created. Checks the order again first, so nothing changed in between.
 */
export const attachGuestOrderWorkflow = createWorkflow("attach-guest-order", function (input: AttachInput) {
  const order = findGuestOrderStep(input)

  const created = when("create-account-for-guest-order", { order, input }, ({ order, input }) => !order.target_customer_id && Boolean(input.auth_identity_id))
    .then(() => createCustomerAccountWorkflow.runAsStep({
      input: transform({ order, input }, ({ order, input }) => ({
        authIdentityId: input.auth_identity_id!,
        customerData: { email: order.email, first_name: order.first_name ?? undefined, last_name: order.last_name ?? undefined, phone: order.phone ?? undefined },
      })),
    }))

  const move = transform({ order, created }, ({ order, created }) => ({
    order_id: order.order_id,
    customer_id: order.target_customer_id ?? created?.id ?? "",
    previous_customer_id: order.previous_customer_id,
  }))
  moveOrderToCustomerStep(move)

  return new WorkflowResponse(transform({ order, created }, ({ order, created }) => ({
    email: order.email,
    account_created: Boolean(created),
  })))
})
