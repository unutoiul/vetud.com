/**
 * The emails live as published templates in Resend (Dashboard > Templates), in the VETUD style.
 * This file only turns each notification's data into that template's variables; the template
 * IDs are in template-ids.ts. Change wording or layout in Resend, not here. The email-list
 * confirmation is the exception: its text is sent as variables so one template serves every language.
 */
export const EmailTemplates = {
  CONTACT_MESSAGE: "contact-message",
  PASSWORD_RESET: "password-reset",
  CUSTOMER_WELCOME: "customer-welcome",
  USER_INVITE: "user-invite",
  EMAIL_LIST_CONFIRM: "email-list-confirm",
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
}

/** Values are inserted into the template HTML as-is, so member input must be escaped. */
function escape(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(new Date(value)) + " UTC"
}

const EMAIL_LIST_COPY = {
  en: {
    subject: "Please confirm your VETUD email sign-up",
    HEADING: "Confirm your email",
    MESSAGE: "Press the button below to start receiving new VETUD guides and answered community questions.",
    BUTTON_LABEL: "Confirm my sign-up",
    FOOTNOTE: "If you didn't ask for this, you can ignore this email and you won't hear from us again.",
  },
  fr: {
    subject: "Veuillez confirmer votre inscription aux e-mails VETUD",
    HEADING: "Confirmez votre adresse e-mail",
    MESSAGE: "Cliquez sur le bouton ci-dessous pour recevoir les nouveaux guides VETUD et les questions de la communauté ayant reçu une réponse.",
    BUTTON_LABEL: "Confirmer mon inscription",
    FOOTNOTE: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail et vous ne recevrez plus rien de notre part.",
  },
}

type Builder = (data: Data) => { variables: Record<string, string>; subject?: string }

const builders: Record<string, Builder> = {
  [EmailTemplates.CONTACT_MESSAGE]: (data) => ({
    variables: {
      SUBJECT: data.subject || "New message",
      NAME: data.name,
      SENDER_EMAIL: data.email,
      ORDER_REF: "",
      MESSAGE: data.message,
    },
  }),
  [EmailTemplates.PASSWORD_RESET]: (data) => ({ variables: { RESET_URL: data.reset_url } }),
  [EmailTemplates.CUSTOMER_WELCOME]: (data) => ({
    variables: { NAME_SUFFIX: data.first_name ? `, ${data.first_name}` : "", STOREFRONT_URL: data.storefront_url },
  }),
  [EmailTemplates.USER_INVITE]: (data) => ({
    variables: {
      INVITE_URL: data.invite_url,
      EXPIRY_NOTE: data.expires_at ? `The link expires on ${dateTime(data.expires_at)}.` : "",
    },
  }),
  [EmailTemplates.EMAIL_LIST_CONFIRM]: (data) => {
    const { subject, ...copy } = data.locale === "fr" ? EMAIL_LIST_COPY.fr : EMAIL_LIST_COPY.en
    return { subject, variables: { ...copy, CONFIRM_URL: data.confirm_url } }
  },
}

/** The Resend template to use and its escaped variables, or null for an unknown template. */
export function buildEmail(template: string, data: Record<string, unknown>) {
  const builder = builders[template]
  if (!builder) return null
  const { variables, subject } = builder(data as Data)
  const contact = template === EmailTemplates.CONTACT_MESSAGE
  return {
    template: template as EmailTemplate,
    variables: Object.fromEntries(Object.entries(variables).map(([key, value]) => [key, escape(value)])),
    // A subject is plain text, so the sender's own words are sent unescaped there.
    subject: contact ? `Contact form: ${variables.SUBJECT} (${variables.NAME})` : subject,
    replyTo: contact ? (data as Data).email : undefined,
  }
}
