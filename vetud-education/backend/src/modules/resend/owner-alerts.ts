/**
 * Alerts for the site owner (STORE_OWNER_EMAIL). Like every education email, the alert is a Resend
 * template (email-list-signup-admin, source in vetud-education/emails); this only fills in its
 * variables. Owner request 2026-11-18.
 */

function dateTime(value: string | Date) {
  return (
    new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(
      new Date(value),
    ) + " UTC"
  )
}

const LANGUAGES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  pt: "Portuguese",
  fr: "French",
  de: "German",
  it: "Italian",
  nl: "Dutch",
  pl: "Polish",
}

export type EmailListSignupAlertData = {
  email: string
  locale: string
  consented_at: string
  confirmed_at: string
  is_member: boolean
  confirmed_count: number
}

/** Someone confirmed their email-list sign-up from the link we emailed them. */
export function emailListSignupAlert(data: EmailListSignupAlertData) {
  return {
    // A subject is plain text, so the address goes there unescaped.
    subject: `New email-list subscriber: ${data.email}`,
    variables: {
      SUBSCRIBER_EMAIL: data.email,
      LANGUAGE: LANGUAGES[data.locale] ?? data.locale,
      MEMBER: data.is_member ? "Yes" : "No",
      SIGNED_UP: dateTime(data.consented_at),
      CONFIRMED: dateTime(data.confirmed_at),
      COUNT: String(data.confirmed_count),
    },
  }
}

/** The three steps of a book order that the owner hears about (owner request 2026-11-28). */
export type BookAlertStep = "requested" | "checkout" | "paid"

export type BookOwnerAlertData = {
  step: BookAlertStep
  email: string
  locale?: string
  at: string
  session_id?: string | null
  /** Amount paid in cents, for the "paid" step. */
  amount?: number | null
  currency?: string | null
}

const BOOK_STEPS: Record<BookAlertStep, { headline: string; summary: string; step: string }> = {
  requested: {
    headline: "Link requested",
    summary:
      "Someone entered their email in the vetud.com pop-up. We emailed them the link to the book's page. They haven't paid yet.",
    step: "1 of 3: asked for the link",
  },
  checkout: {
    headline: "Checkout opened, not paid yet",
    summary:
      "Someone opened Stripe's payment page for Peptides Explained. They haven't paid yet; you'll get another email if they do.",
    step: "2 of 3: checkout opened",
  },
  paid: {
    headline: "Book sold",
    summary: "Stripe confirmed the payment and we emailed the download link to the customer.",
    step: "3 of 3: paid",
  },
}

/** A step of a book order: link asked for, checkout opened, or paid. */
export function bookOwnerAlert(data: BookOwnerAlertData) {
  const step = BOOK_STEPS[data.step]
  const paid =
    data.step === "paid"
      ? `Yes${data.amount != null ? `, ${(data.amount / 100).toFixed(2)} ${(data.currency ?? "usd").toUpperCase()}` : ""}`
      : "Not yet"
  return {
    subject: `Book: ${step.headline} (${data.email})`,
    variables: {
      HEADLINE: step.headline,
      SUMMARY: step.summary,
      BUYER_EMAIL: data.email,
      STEP: step.step,
      PAID: paid,
      LANGUAGE: data.locale ? (LANGUAGES[data.locale] ?? data.locale) : "Not known",
      WHEN: dateTime(data.at),
      STRIPE_SESSION: data.session_id || "None yet",
    },
  }
}
