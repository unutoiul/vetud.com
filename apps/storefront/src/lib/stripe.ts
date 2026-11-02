import type { HttpTypes } from "@medusajs/types"
import { loadStripe, type Stripe } from "@stripe/stripe-js"

export const STRIPE_PROVIDER_ID = "pp_stripe_stripe"

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""

export const stripeEnabled = Boolean(PUBLISHABLE_KEY)
export const stripeSandbox = PUBLISHABLE_KEY.startsWith("pk_test_")

let stripePromise: Promise<Stripe | null> | null = null

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
