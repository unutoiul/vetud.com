import { MedusaError } from "@medusajs/framework/utils"

export type CartForOwnerCheck = {
  customer_id?: string | null
}

/**
 * Throws unless the cart belongs to the signed-in customer.
 * There is no guest checkout: `customerId` is the authenticated customer, never taken from the cart.
 */
export function validateCartOwner(cart: CartForOwnerCheck, customerId: string | undefined | null) {
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to your account to place an order.")
  }
  if (cart.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart does not belong to your account. Return to checkout and try again.")
  }
}
