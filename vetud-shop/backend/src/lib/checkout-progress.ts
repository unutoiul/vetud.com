/**
 * How far a shopper got in checkout, read from the cart itself (owner request 2026-11-17), so the
 * checkout sends nothing extra. Each step is saved as the shopper completes it: the email, the
 * delivery address, the delivery option, the payment method, and finally the order.
 */
export const CHECKOUT_STEPS = ["cart", "contact", "address", "delivery", "payment", "placed"] as const
export type CheckoutStep = (typeof CHECKOUT_STEPS)[number]

export type CartProgress = {
  email?: string | null
  completed_at?: string | Date | null
  shipping_address?: { address_1?: string | null } | null
  shipping_methods?: unknown[] | null
  payment_collection?: { payment_sessions?: unknown[] | null } | null
}

export function furthestCheckoutStep(cart: CartProgress): CheckoutStep {
  if (cart.completed_at) return "placed"
  if (cart.payment_collection?.payment_sessions?.length) return "payment"
  if (cart.shipping_methods?.length) return "delivery"
  if (cart.shipping_address?.address_1) return "address"
  if (cart.email) return "contact"
  return "cart"
}

/** How many carts reached at least each step. */
export function checkoutFunnel(carts: CartProgress[]): Record<CheckoutStep, number> {
  const funnel = Object.fromEntries(CHECKOUT_STEPS.map((step) => [step, 0])) as Record<CheckoutStep, number>
  for (const cart of carts) {
    const reached = CHECKOUT_STEPS.indexOf(furthestCheckoutStep(cart))
    for (const step of CHECKOUT_STEPS.slice(0, reached + 1)) funnel[step] += 1
  }
  return funnel
}
