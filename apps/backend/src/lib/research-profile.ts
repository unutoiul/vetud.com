import { MedusaError } from "@medusajs/framework/utils"

/**
 * Research-use acknowledgment required to place an order.
 * Keep the version in sync with apps/storefront/src/lib/research.ts.
 */
export const RUO_ACK_VERSION = "2026-10"

export type CartForResearchCheck = {
  customer_id?: string | null
  metadata?: Record<string, unknown> | null
}

/**
 * Throws unless the cart belongs to the signed-in customer and carries the current acknowledgment.
 * There is no guest checkout: `customerId` is the authenticated customer, never taken from the cart.
 */
export function validateResearchProfile(cart: CartForResearchCheck, customerId: string | undefined | null) {
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to your account to place an order.")
  }
  if (cart.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart does not belong to your account. Return to checkout and try again.")
  }

  const metadata = cart.metadata ?? {}
  if (metadata.ruo_acknowledged !== true || metadata.ruo_ack_version !== RUO_ACK_VERSION) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You must confirm that the products are for laboratory research purposes only, and not for human therapeutic use, to place an order."
    )
  }
}
