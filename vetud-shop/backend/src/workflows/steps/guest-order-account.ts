import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

/** A guest can add an order to an account from the confirmation page for this long after ordering. */
export const GUEST_ORDER_CLAIM_HOURS = 24

export type FindGuestOrderInput = {
  order_id: string
  /** The cart the order was placed from. Only the browser that checked out knows it. */
  cart_id: string
  /** The signed-in member, when adding the order to an existing account. */
  customer_id?: string
}

export type GuestOrder = {
  order_id: string
  email: string
  previous_customer_id: string | null
  /** The signed-in member who gets the order, or null when a new account is needed. */
  target_customer_id: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
}

type OrderRow = {
  id: string
  email?: string | null
  created_at: string | Date
  customer_id?: string | null
  customer?: { has_account?: boolean | null } | null
  cart?: { id: string } | null
  shipping_address?: { first_name?: string | null; last_name?: string | null; phone?: string | null } | null
}

function orderDetails(order: OrderRow, email: string): Omit<GuestOrder, "target_customer_id"> {
  return {
    order_id: order.id,
    email: email.trim().toLowerCase(),
    previous_customer_id: order.customer_id ?? null,
    first_name: order.shipping_address?.first_name ?? null,
    last_name: order.shipping_address?.last_name ?? null,
    phone: order.shipping_address?.phone ?? null,
  }
}

/**
 * Checks that this browser placed the order (it knows the order's cart), that the order is a guest
 * order from the last 24 hours, and who should get it: the signed-in member with the same email, or
 * a new account when there isn't one for that email yet.
 */
export const findGuestOrderStep = createStep("find-guest-order", async (input: FindGuestOrderInput, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "email", "created_at", "customer_id", "customer.has_account", "cart.id", "shipping_address.first_name", "shipping_address.last_name", "shipping_address.phone"],
    filters: { id: input.order_id },
  })
  const order = data[0] as OrderRow | undefined
  // The same answer whether the order is unknown or the cart doesn't match, so nothing leaks.
  if (!order || !order.cart?.id || order.cart.id !== input.cart_id || !order.email) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "We couldn't find this order from this browser.")
  }
  if (order.customer?.has_account !== false) {
    // Already filed in the signed-in member's account (an order placed with a member's email is
    // filed when it's placed): nothing to move.
    if (input.customer_id && order.customer_id === input.customer_id) {
      return new StepResponse<GuestOrder>({ ...orderDetails(order, order.email), target_customer_id: input.customer_id })
    }
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This order is already in an account.")
  }
  if (Date.now() - new Date(order.created_at).getTime() > GUEST_ORDER_CLAIM_HOURS * 3_600_000) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This order is too old to add here. Contact us and we'll add it to your account.")
  }

  const email = order.email.trim().toLowerCase()
  const customers = container.resolve(Modules.CUSTOMER)
  let target: string | null = null
  if (input.customer_id) {
    const [member] = await customers.listCustomers({ id: input.customer_id })
    if (!member?.has_account || member.email?.trim().toLowerCase() !== email) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Sign in with the email used for this order to add it to your account.")
    }
    target = member.id
  } else {
    const existing = await customers.listCustomers({ email: [email, order.email], has_account: true })
    if (existing.length) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "There's already an account for this email. Sign in to add this order to it.")
    }
  }

  return new StepResponse<GuestOrder>({ ...orderDetails(order, order.email), target_customer_id: target })
})

/** Moves the order to the member's account; undone if a later step fails. */
export const moveOrderToCustomerStep = createStep(
  "move-order-to-customer",
  async (input: { order_id: string; customer_id: string; previous_customer_id: string | null }, { container }) => {
    await container.resolve(Modules.ORDER).updateOrders(input.order_id, { customer_id: input.customer_id })
    return new StepResponse({ order_id: input.order_id, customer_id: input.customer_id }, input)
  },
  async (input, { container }) => {
    if (!input?.previous_customer_id) return
    await container.resolve(Modules.ORDER).updateOrders(input.order_id, { customer_id: input.previous_customer_id })
  }
)
