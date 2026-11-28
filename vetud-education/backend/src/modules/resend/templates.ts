import { LIST_LOCALES, type ListLocale, normalizeEmail, unsubscribeToken } from "../../lib/email-list"
import { emailSettings } from "../../lib/notifications"
import {
  bookOwnerAlert,
  emailListSignupAlert,
  type BookOwnerAlertData,
  type EmailListSignupAlertData,
} from "./owner-alerts"

/**
 * Every education email is a published Resend template, with the VETUD logo, vetud.com links and no
 * links to the shop. Their sources and shared layout are in vetud-education/emails, and their IDs in
 * template-ids.ts (written by publish.mjs there). This file only turns each notification's data into
 * its template's variables: change wording or layout in vetud-education/emails, not here.
 */
export const EmailTemplates = {
  CONTACT_MESSAGE: "contact-message",
  PASSWORD_RESET: "password-reset",
  CUSTOMER_WELCOME: "customer-welcome",
  USER_INVITE: "user-invite",
  EMAIL_LIST_CONFIRM: "email-list-confirm",
  /** The French confirmation; sent in place of EMAIL_LIST_CONFIRM when the visitor's language is French. */
  EMAIL_LIST_CONFIRM_FR: "email-list-confirm-fr",
  SIGN_IN_CODE: "sign-in-code",
  /** Confirms a new sign-in email: sent to the new address. */
  EMAIL_CHANGE_CODE: "email-change-code",
  EMAIL_LIST_SIGNUP_ADMIN: "email-list-signup-admin",
  /** Sent when someone asks for the book in the pop-up: a link to its page, where they can pay. */
  BOOK_OFFER: "book-offer",
  /** Sent after a paid Stripe Checkout for the book: how to download it. */
  BOOK_PURCHASE: "book-purchase",
  /** Sent when someone opens the book's Stripe checkout with an address typed on the page: a link to finish later. */
  BOOK_CHECKOUT_STARTED: "book-checkout-started",
  /** The owner's alert for each step of a book order (link asked for, checkout opened, paid). */
  BOOK_OWNER_ALERT: "book-owner-alert",
} as const

export type EmailTemplate = (typeof EmailTemplates)[keyof typeof EmailTemplates]

/** Emails to the owner and the admin team ("audience": "owner" in templates.json): no unsubscribe link. */
const OWNER_TEMPLATES = new Set<string>([
  EmailTemplates.CONTACT_MESSAGE,
  EmailTemplates.USER_INVITE,
  EmailTemplates.EMAIL_LIST_SIGNUP_ADMIN,
  EmailTemplates.BOOK_OWNER_ALERT,
])

type Data = {
  subject?: string
  name: string
  email: string
  message: string
  reset_url: string
  first_name?: string | null
  storefront_url: string
  invite_url: string
  expires_at?: string | null
  locale?: string
  confirm_url: string
  code: string
  minutes: number
  download_url: string
  buy_url: string
}

/** Variables go into the template HTML as-is, so everything is escaped (member input included). */
function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function dateTime(value: string) {
  return (
    new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(
      new Date(value),
    ) + " UTC"
  )
}

type Built = {
  /** Another template than the one asked for (the French email-list confirmation). */
  template?: EmailTemplate
  variables: Record<string, string>
  /** Overrides the template's subject; plain text, never escaped. */
  subject?: string
  replyTo?: string
}

const builders: Record<string, (data: Data) => Built> = {
  [EmailTemplates.CONTACT_MESSAGE]: (data) => {
    const subject = data.subject || "New message"
    return {
      variables: { SUBJECT: subject, NAME: data.name, SENDER_EMAIL: data.email, MESSAGE: data.message },
      subject: `Contact form: ${subject} (${data.name})`,
      replyTo: data.email,
    }
  },
  [EmailTemplates.PASSWORD_RESET]: (data) => ({ variables: { RESET_URL: data.reset_url } }),
  [EmailTemplates.CUSTOMER_WELCOME]: (data) => ({
    variables: {
      NAME_SUFFIX: data.first_name ? `, ${data.first_name}` : "",
      SITE_URL: data.storefront_url.replace(/\/+$/, ""),
    },
  }),
  [EmailTemplates.USER_INVITE]: (data) => ({
    variables: {
      INVITE_URL: data.invite_url,
      EXPIRY_NOTE: data.expires_at ? `The link expires on ${dateTime(data.expires_at)}.` : "",
    },
  }),
  [EmailTemplates.EMAIL_CHANGE_CODE]: (data) => ({
    variables: {
      CODE: String(data.code).replace(/\D/g, "").slice(0, 6),
      MINUTES: String(Number(data.minutes) || 10),
    },
  }),
  [EmailTemplates.SIGN_IN_CODE]: (data) => ({
    variables: {
      CODE: String(data.code).replace(/\D/g, "").slice(0, 6),
      MINUTES: String(Number(data.minutes) || 10),
      GREETING: data.first_name ? `Hi ${data.first_name},` : "Hi,",
    },
  }),
  [EmailTemplates.EMAIL_LIST_CONFIRM]: (data) => ({
    template: data.locale === "fr" ? EmailTemplates.EMAIL_LIST_CONFIRM_FR : EmailTemplates.EMAIL_LIST_CONFIRM,
    variables: { CONFIRM_URL: String(data.confirm_url) },
  }),
  [EmailTemplates.BOOK_OFFER]: (data) => ({ variables: { BUY_URL: String(data.buy_url) } }),
  [EmailTemplates.BOOK_PURCHASE]: (data) => ({ variables: { DOWNLOAD_URL: String(data.download_url) } }),
  [EmailTemplates.BOOK_CHECKOUT_STARTED]: (data) => ({ variables: { BUY_URL: String(data.buy_url) } }),
  [EmailTemplates.BOOK_OWNER_ALERT]: (data) => bookOwnerAlert(data as unknown as BookOwnerAlertData),
  [EmailTemplates.EMAIL_LIST_SIGNUP_ADMIN]: (data) => emailListSignupAlert(data as unknown as EmailListSignupAlertData),
}

/**
 * The signed link behind "Unsubscribe" at the bottom of every reader's email (owner request
 * 2026-11-28), in the reader's language when it's known. Owner emails don't show it.
 */
export function unsubscribeUrl(to: string, locale?: unknown) {
  const lang = LIST_LOCALES.includes(locale as ListLocale) ? (locale as ListLocale) : "en"
  const query = new URLSearchParams({ email: normalizeEmail(to), token: unsubscribeToken(to) })
  return `${emailSettings().storefrontUrl}/${lang}/newsletter/unsubscribe?${query}`
}

/**
 * The Resend template to send and its escaped variables, or null for an unknown template. With the
 * recipient's address, UNSUBSCRIBE_URL is filled in too (templates without the link ignore it).
 */
export function buildEmail(template: string, data: Record<string, unknown>, to?: string) {
  const builder = builders[template]
  if (!builder) return null
  const built = builder(data as Data)
  // Without JWT_SECRET there is no signed link; the template then falls back to "email us to unsubscribe".
  const variables =
    to && process.env.JWT_SECRET && !OWNER_TEMPLATES.has(template)
      ? { ...built.variables, UNSUBSCRIBE_URL: unsubscribeUrl(to, data.locale) }
      : built.variables
  return {
    template: built.template ?? (template as EmailTemplate),
    variables: Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escape(value)])),
    subject: built.subject,
    replyTo: built.replyTo,
  }
}
