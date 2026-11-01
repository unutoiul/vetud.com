import type { HttpTypes } from "@medusajs/types"

export const MAKEPAY_PROVIDER_ID = "pp_makepay_makepay"

// Exact origin of MakePay's hosted checkout. An allowlist, never derived from the returned URL.
const MAKEPAY_CHECKOUT_ORIGIN = (
  process.env.NEXT_PUBLIC_MAKEPAY_CHECKOUT_ORIGIN || "https://www.makepay.io"
).replace(/\/$/, "")

export const MAKEPAY_STORAGE = {
  orderId: "makepay_order_id",
  returnState: "makepay_return_state",
  countryCode: "makepay_country_code",
} as const

/** Reads and validates the hosted-checkout redirect that MakePay put on the payment session. */
export function readMakePayRedirect(cart: HttpTypes.StoreCart) {
  const session = cart.payment_collection?.payment_sessions?.find(
    (candidate) => candidate.provider_id === MAKEPAY_PROVIDER_ID
  )
  const nextAction = session?.data?.next_action as { type?: unknown; url?: unknown } | undefined
  const returnState = session?.data?.return_state

  if (nextAction?.type !== "redirect" || typeof nextAction.url !== "string" || typeof returnState !== "string" || !returnState) {
    throw new Error("The crypto payment could not be prepared. Please try again or choose another payment method.")
  }
  const url = new URL(nextAction.url)
  if (url.protocol !== "https:" || url.origin !== MAKEPAY_CHECKOUT_ORIGIN) {
    throw new Error("The crypto payment provider returned an unexpected address. Please choose another payment method.")
  }
  return { url: url.href, returnState }
}
