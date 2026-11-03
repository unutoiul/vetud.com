import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

/**
 * Medusa's Stripe provider copies session data into the PaymentIntent request, so a shopper could
 * otherwise set `capture_method`, `confirm` or `payment_method`. Discard those overrides.
 * Stripe chooses eligible methods from the server's Dashboard configuration; exclude redirects
 * because this checkout confirms payment in place (including the 3-D Secure modal).
 */
export function prepareStripeSession(req: MedusaRequest<{ provider_id: string; data?: unknown }>, _res: MedusaResponse, next: MedusaNextFunction) {
  if (req.body?.provider_id === STRIPE_PROVIDER_ID) {
    req.body.data = { automatic_payment_methods: { enabled: true, allow_redirects: "never" } }
    req.validatedBody = req.body
  }
  next()
}
