import { MedusaError } from "@medusajs/framework/utils"

export type CartForOwnerCheck = {
  customer_id?: string | null
  /** Load `customer.has_account` with the cart: without it a linked customer counts as a member. */
  customer?: { has_account?: boolean | null } | null
}

/**
 * Who may use a cart at checkout (owner request 2026-11-17: guests can order without an account).
 *
 * - A guest cart (no customer yet, or a customer Medusa made for a guest email, `has_account: false`)
 *   can be checked out by whoever holds it, signed in or not.
 * - A cart that belongs to a member account can only be used by that member, signed in.
 *
 * A linked customer only counts as a guest when the server says so, so a missing relation can never
 * open a member's cart. `customerId` is always the authenticated customer, never taken from the cart.
 */
export function validateCartOwner(cart: CartForOwnerCheck, customerId: string | undefined | null) {
  if (customerId && cart.customer_id === customerId) return
  const guestCart = cart.customer_id ? cart.customer?.has_account === false : true
  if (guestCart) return
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to your account to place this order.")
  }
  throw new MedusaError(
    MedusaError.Types.NOT_ALLOWED,
    "This cart does not belong to your account. Return to checkout and try again.",
  )
}
