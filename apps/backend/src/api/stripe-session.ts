import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

/**
 * Medusa's Stripe provider copies session data into the PaymentIntent request, so a shopper could
 * otherwise set `capture_method`, `confirm` or `payment_method`. Replace it with a card-only
 * intent: the storefront confirms cards in place (3-D Secure opens in a modal), with no redirects.
 */
export function prepareStripeSession(req: MedusaRequest<{ provider_id: string; data?: unknown }>, _res: MedusaResponse, next: MedusaNextFunction) {
  if (req.body?.provider_id === STRIPE_PROVIDER_ID) {
    req.body.data = { payment_method_types: ["card"] }
    req.validatedBody = req.body
  }
  next()
}
