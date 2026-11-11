/**
 * The emails live as published templates in Resend (Dashboard > Templates), in the VETUD style.
 * This file only turns each notification's data into that template's variables; the template
 * IDs are in template-ids.ts. Change wording or layout in Resend, not here. The email-list
 * confirmation is the exception: its text is sent as variables so one template serves every language.
 * The sign-in code is written here in full (signInCodeEmail), because it has no template in Resend.
 */
export const EmailTemplates = {
  CONTACT_MESSAGE: "contact-message",
  PASSWORD_RESET: "password-reset",
  CUSTOMER_WELCOME: "customer-welcome",
  USER_INVITE: "user-invite",
  EMAIL_LIST_CONFIRM: "email-list-confirm",
  SIGN_IN_CODE: "sign-in-code",
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

const NAVY = "#15265E"
const MUTED = "#55617A"

/** The sign-in code email: plain, readable on any client, with no images to load. */
function signInCodeEmail(data: Data) {
  const code = String(data.code).replace(/\D/g, "").slice(0, 6)
  const minutes = Number(data.minutes) || 10
  const greeting = data.first_name ? `Hi ${escape(data.first_name)},` : "Hi,"
  const subject = "Your VETUD sign-in code"
  const text = [
    data.first_name ? `Hi ${data.first_name},` : "Hi,",
    "",
    `Your VETUD sign-in code is ${code}.`,
    `Enter it on the sign-in page to finish signing in. It works once and expires in ${minutes} minutes.`,
    "",
    "If you didn't try to sign in, you can ignore this email: nobody can sign in without this code. As your password was used, it's worth changing it from your account page.",
    "",
    "VETUD · www.vetud.com",
  ].join("\n")
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#F3F6FA;">
<div style="display:none;max-height:0;overflow:hidden;">Use ${code} to finish signing in. It expires in ${minutes} minutes.</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F3F6FA;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:1px solid #E1E7EF;border-radius:12px;">
<tr><td style="padding:28px 32px 0;font-family:Helvetica,Arial,sans-serif;">
<div style="font-size:22px;letter-spacing:6px;color:${NAVY};">VETUD</div>
<div style="font-size:10px;letter-spacing:3px;color:${MUTED};text-transform:uppercase;margin-top:2px;">Peptides education</div>
</td></tr>
<tr><td style="padding:28px 32px 8px;font-family:Helvetica,Arial,sans-serif;color:${NAVY};">
<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${greeting}</p>
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;">Your sign-in code</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${MUTED};">Enter this code on the VETUD sign-in page to finish signing in.</p>
<div style="margin:0 0 20px;padding:18px 0;background:#F3F6FA;border-radius:10px;text-align:center;font-family:'Courier New',Courier,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:${NAVY};">${code}</div>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${MUTED};">It works once and expires in ${minutes} minutes.</p>
<p style="margin:0 0 28px;font-size:13px;line-height:1.6;color:${MUTED};">If you didn't try to sign in, you can ignore this email: nobody can sign in without this code. As your password was used, it's worth changing it from your account page.</p>
</td></tr>
<tr><td style="padding:16px 32px 24px;border-top:1px solid #E1E7EF;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${MUTED};">VETUD · <a href="https://www.vetud.com" style="color:${MUTED};">www.vetud.com</a></td></tr>
</table>
</td></tr>
</table>
</body></html>`
  return { subject, html, text }
}

/** Emails written in full here rather than as Resend templates. */
const inlineEmails: Record<string, (data: Data) => { subject: string; html: string; text: string }> = {
  [EmailTemplates.SIGN_IN_CODE]: signInCodeEmail,
}

/** The Resend template to use and its escaped variables, or null for an unknown template. */
export function buildEmail(template: string, data: Record<string, unknown>) {
  const inline = inlineEmails[template]
  if (inline) return { template: template as EmailTemplate, variables: {}, replyTo: undefined, ...inline(data as Data) }
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
