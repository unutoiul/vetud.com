import { MedusaError } from "@medusajs/framework/utils"

export function validateCartOwnership(cart: {
  customer_id?: string | null
  customer?: { has_account?: boolean } | null
} | null | undefined, customerId: string) {
  // A linked customer is only a guest when the server explicitly says so.
  // Missing relations must not permit taking over a registered shopper's cart.
  const sameOwner = cart?.customer_id === customerId
  const guest = cart && (cart.customer_id
    ? cart.customer?.has_account === false
    : cart.customer?.has_account !== true)
  if (!customerId?.trim() || !cart || (!sameOwner && !guest)) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart belongs to another account. Please start a new cart.")
  }
}
