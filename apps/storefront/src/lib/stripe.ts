import type { HttpTypes } from "@medusajs/types"
import { loadStripe, type Stripe, type StripePaymentElementOptions } from "@stripe/stripe-js"

export const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""

export const stripeEnabled = Boolean(PUBLISHABLE_KEY)
export const stripeSandbox = PUBLISHABLE_KEY.startsWith("pk_test_")

let stripePromise: Promise<Stripe | null> | null = null

export type StripeBillingDetails = NonNullable<StripePaymentElementOptions["defaultValues"]>["billingDetails"]

/** Prefer the address reviewed at checkout over Stripe's browser-location defaults. */
export function stripeBillingDetails(cart: HttpTypes.StoreCart): StripeBillingDetails {
  const address = cart.billing_address ?? cart.shipping_address
  return {
    name: [address?.first_name, address?.last_name].filter(Boolean).join(" ") || undefined,
    email: cart.email || undefined,
    phone: address?.phone || undefined,
    address: {
      country: address?.country_code?.toUpperCase(),
      line1: address?.address_1 || undefined,
      line2: address?.address_2 || undefined,
      city: address?.city || undefined,
      postal_code: address?.postal_code || undefined,
      state: address?.province || undefined,
    },
  }
}

/** Loads Stripe.js once, on the first checkout that needs it. */
export function getStripe() {
  stripePromise ??= loadStripe(PUBLISHABLE_KEY)
  return stripePromise
}

/** The PaymentIntent client secret the backend put on the cart's Stripe session. */
export function readStripeClientSecret(cart: HttpTypes.StoreCart) {
  const session = cart.payment_collection?.payment_sessions?.find((candidate) => candidate.provider_id === STRIPE_PROVIDER_ID)
  const secret = session?.data?.client_secret
  return typeof secret === "string" && secret.startsWith("pi_") ? secret : null
}
