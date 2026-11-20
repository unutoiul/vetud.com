import { ContainerRegistrationKeys, MedusaError, Modules, validateEmail } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateCartWorkflow } from "@medusajs/medusa/core-flows"
import { isAnotherMembersEmail, memberIdsForEmail } from "../lib/checkout-email"

export type SetCheckoutEmailInput = {
  cart_id: string
  email: string
  /** The signed-in shopper, from the request's authentication; never from the body. */
  customer_id?: string | null
}

/** Kept for the storefront: an email never stops checkout any more, so this is always false. */
export type SetCheckoutEmailResult = { account_exists: false }

type GuestCustomerChange = { cart_id: string; previous_customer_id: string | null; created_customer_id: string | null }

/**
 * The email is all a shopper needs to order (owner, 2026-11-20), even when a member account uses
 * it. Medusa would link the cart to that member, and a member's cart needs the member signed in, so
 * the cart goes on a guest record for the email instead. The order is filed in the member's account
 * when it's placed (hooks/link-member-order.ts), and the shopper never sees the account's details.
 */
const useGuestCustomerStep = createStep(
  "use-guest-customer-for-checkout-email",
  async (input: SetCheckoutEmailInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const email = validateEmail(input.email.trim())
    // A signed-in member giving their own email keeps Medusa's normal update (the cart stays theirs).
    if (!isAnotherMembersEmail(await memberIdsForEmail(query, email), input.customer_id)) return new StepResponse<GuestCustomerChange | null>(null)

    const { data } = await query.graph({ entity: "cart", fields: ["id", "customer_id"], filters: { id: input.cart_id } })
    const cart = data[0] as { id: string; customer_id?: string | null } | undefined
    if (!cart) throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart id not found: ${input.cart_id}`)

    const customers = container.resolve(Modules.CUSTOMER)
    let [guest] = await customers.listCustomers({ email, has_account: false })
    let createdId: string | null = null
    if (!guest) {
      guest = await customers.createCustomers({ email })
      createdId = guest.id
    }
    if (cart.customer_id === guest.id) return new StepResponse<GuestCustomerChange | null>(null)

    await container.resolve(Modules.CART).updateCarts(cart.id, { customer_id: guest.id })
    const change: GuestCustomerChange = { cart_id: cart.id, previous_customer_id: cart.customer_id ?? null, created_customer_id: createdId }
    return new StepResponse<GuestCustomerChange | null>(change, change)
  },
  async (change, { container }) => {
    if (!change) return
    await container.resolve(Modules.CART).updateCarts(change.cart_id, { customer_id: change.previous_customer_id })
    if (change.created_customer_id) await container.resolve(Modules.CUSTOMER).deleteCustomers(change.created_customer_id)
  }
)

/**
 * The guest checkout's Contact step: saves the email for the order confirmation through Medusa's
 * own cart update (which also starts the owner's guest-checkout alert).
 */
export const setCheckoutEmailWorkflow = createWorkflow(
  "set-checkout-email",
  function (input: SetCheckoutEmailInput) {
    useGuestCustomerStep(input)
    updateCartWorkflow.runAsStep({ input: transform({ input }, ({ input }) => ({ id: input.cart_id, email: input.email.trim() })) })
    return new WorkflowResponse(transform({}, (): SetCheckoutEmailResult => ({ account_exists: false })))
  }
)
