import type { HttpTypes } from "@medusajs/types"

export const PAYPAL_PROVIDER_ID = "pp_paypal_paypal"

// PayPal's hosted approval pages (production and sandbox). An allowlist, never derived from user input.
const PAYPAL_ORIGINS = ["https://www.paypal.com", "https://www.sandbox.paypal.com"]

/** Reads and validates the PayPal approval URL the backend put on the payment session. */
export function readPayPalRedirect(cart: HttpTypes.StoreCart) {
  const session = cart.payment_collection?.payment_sessions?.find((candidate) => candidate.provider_id === PAYPAL_PROVIDER_ID)
  const approveUrl = session?.data?.approve_url
  if (typeof approveUrl !== "string") {
    throw new Error("The PayPal payment could not be prepared. Please try again or choose another payment method.")
  }
  const url = new URL(approveUrl)
  if (url.protocol !== "https:" || !PAYPAL_ORIGINS.includes(url.origin)) {
    throw new Error("PayPal returned an unexpected address. Please choose another payment method.")
  }
  return { url: url.href }
}
