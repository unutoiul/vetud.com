import { formatCurrency } from "../../lib/currencies"

/**
 * Alerts for the shop owner (STORE_OWNER_EMAIL). Like every shop email they're Resend templates
 * (guest-checkout-admin and newsletter-signup-admin, sources in vetud-shop/emails); this only fills
 * in their variables. The subject is plain text, so it's set here unescaped. Owner request 2026-11-18.
 */

function dateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
}

function countryName(code?: string | null) {
  if (!code) return ""
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase())
    return name && name !== code.toUpperCase() ? `${name} (${code.toUpperCase()})` : code.toUpperCase()
  } catch {
    return code.toUpperCase()
  }
}

export type NewsletterSignupAlertData = {
  email: string
  country_code?: string | null
  has_account: boolean
  offer_code?: string | null
  subscribed_at: string
  customer_url: string
}

/** Someone ticked the consent box in the shop's sign-up pop-up. */
export function newsletterSignupAlert(data: NewsletterSignupAlertData) {
  return {
    subject: `New newsletter sign-up: ${data.email}`,
    variables: {
      CUSTOMER_EMAIL: data.email,
      COUNTRY: countryName(data.country_code) || "Not given",
      ACCOUNT: data.has_account ? "Yes" : "No",
      OFFER_CODE: data.offer_code || "None (no pop-up offer is running)",
      SIGNED_UP: dateTime(data.subscribed_at),
      CUSTOMER_URL: data.customer_url,
    },
  }
}

export type GuestCheckoutAlertData = {
  email: string
  currency_code: string
  items: { title: string; quantity: number; unit_price: number }[]
  region?: string | null
  account_exists: boolean
  started_at: string
  unfinished_url: string
}

/** A shopper who isn't signed in gave their email at the first checkout step. */
export function guestCheckoutAlert(data: GuestCheckoutAlertData) {
  const value = data.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  const total = formatCurrency(value, data.currency_code)
  return {
    subject: `Guest checkout started: ${data.email} (${total})`,
    variables: {
      CUSTOMER_EMAIL: data.email,
      CART: data.items.map((item) => `${item.title} × ${item.quantity} · ${formatCurrency(item.unit_price * item.quantity, data.currency_code)}`).join("\n"),
      CART_VALUE: total,
      REGION: data.region || "Not set",
      ACCOUNT: data.account_exists ? "This email has an account, but they aren't signed in" : "No account",
      STARTED: dateTime(data.started_at),
      UNFINISHED_URL: data.unfinished_url,
    },
  }
}
