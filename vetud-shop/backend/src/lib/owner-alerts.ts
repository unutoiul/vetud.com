/**
 * When the shop owner is emailed about a shopper (owner request 2026-11-18): a new newsletter
 * sign-up, and a guest who starts checkout. The emails themselves are in modules/resend/owner-alerts.ts.
 */

/** Custom event emitted by the newsletter workflow when an address newly agrees to offers. */
export const NEWSLETTER_SUBSCRIBED_EVENT = "newsletter.subscribed"

export type NewsletterSubscribedEvent = {
  customer_id: string
  email: string
  country_code?: string | null
  has_account: boolean
  offer_code?: string | null
  subscribed_at: string
}

/**
 * A sign-up is new when the address hadn't already agreed to offers and wasn't in the Newsletter
 * group, so sending the pop-up again doesn't alert the owner twice. Someone who unsubscribed and
 * signs up again counts as new.
 */
export function isNewNewsletterSignup(previous: { marketing_consent?: unknown } | null | undefined, wasInGroup: boolean) {
  return !(previous?.marketing_consent === true && wasInGroup)
}

export type GuestCartRow = {
  id: string
  email?: string | null
  completed_at?: string | Date | null
  customer?: { has_account?: boolean | null } | null
  items?: unknown[] | null
}

/**
 * A guest checkout: a cart with items and an email, not yet ordered, whose customer is missing or
 * has no account. A signed-in member's cart never counts. The email is saved at the guest's first
 * checkout step (Contact), so that's when the owner hears about it.
 */
export function isGuestCheckout<T extends GuestCartRow>(cart: T | null | undefined): cart is T & { email: string } {
  if (!cart?.email || cart.completed_at || !cart.items?.length) return false
  return !cart.customer || cart.customer.has_account === false
}

/** One alert per cart and address; a corrected email gets its own alert. */
export function guestCheckoutAlertKey(cartId: string, email: string) {
  return `guest-checkout-alert:${cartId}:${email.trim().toLowerCase()}`
}
