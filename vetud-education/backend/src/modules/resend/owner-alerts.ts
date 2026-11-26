/**
 * Alerts for the site owner (STORE_OWNER_EMAIL). Like every education email, the alert is a Resend
 * template (email-list-signup-admin, source in vetud-education/emails); this only fills in its
 * variables. Owner request 2026-11-18.
 */

function dateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
}

const LANGUAGES: Record<string, string> = {
  en: "English", es: "Spanish", pt: "Portuguese", fr: "French", de: "German", it: "Italian", nl: "Dutch", pl: "Polish",
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
