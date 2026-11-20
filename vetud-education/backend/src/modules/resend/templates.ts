import { emailListSignupAlert, type EmailListSignupAlertData } from "./owner-alerts"

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
} as const

export type EmailTemplate = (typeof EmailTemplates)[keyof typeof EmailTemplates]

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
}

/** Variables go into the template HTML as-is, so everything is escaped (member input included). */
function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
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
    variables: { NAME_SUFFIX: data.first_name ? `, ${data.first_name}` : "", SITE_URL: data.storefront_url.replace(/\/+$/, "") },
  }),
  [EmailTemplates.USER_INVITE]: (data) => ({
    variables: { INVITE_URL: data.invite_url, EXPIRY_NOTE: data.expires_at ? `The link expires on ${dateTime(data.expires_at)}.` : "" },
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
  [EmailTemplates.EMAIL_LIST_SIGNUP_ADMIN]: (data) => emailListSignupAlert(data as unknown as EmailListSignupAlertData),
}

/** The Resend template to send and its escaped variables, or null for an unknown template. */
export function buildEmail(template: string, data: Record<string, unknown>) {
  const builder = builders[template]
  if (!builder) return null
  const built = builder(data as Data)
  return {
    template: built.template ?? (template as EmailTemplate),
    variables: Object.fromEntries(Object.entries(built.variables).map(([key, value]) => [key, escape(value)])),
    subject: built.subject,
    replyTo: built.replyTo,
  }
}
