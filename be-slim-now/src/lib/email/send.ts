import "server-only"
import { Resend } from "resend"
import { RESEND_TEMPLATE_IDS } from "./template-ids"
import type { EmailTemplate } from "./templates"
import { unsubscribeUrl } from "./unsubscribe"

let client: Resend | null = null
const resend = (key: string) => (client ??= new Resend(key))

type Email = {
  template: EmailTemplate
  to: string
  variables: Record<string, string>
  replyTo?: string
}

/** Emails to the owner ("audience": "owner" in emails/templates.json): no unsubscribe link. */
const OWNER_TEMPLATES = new Set<EmailTemplate>(["order-admin", "subscribe-admin"])

/**
 * Customer emails get a signed unsubscribe link for the recipient (owner request 2026-11-28). Without
 * BESLIMNOW_API_SECRET there's none, and the template's fallback (an email to us) is used instead.
 */
function withUnsubscribe(template: EmailTemplate, to: string, variables: Record<string, string>) {
  const link = OWNER_TEMPLATES.has(template) ? undefined : unsubscribeUrl(to)
  return link ? { ...variables, UNSUBSCRIBE_URL: link } : variables
}

/**
 * Sends a published Resend template. Without RESEND_API_KEY (local development) the email is printed
 * to the server console instead, so the order flow can be tested end to end.
 */
export async function sendTemplate({ template, to, variables, replyTo }: Email) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(
      `[email:dev] ${template} → ${to}${replyTo ? ` (reply-to ${replyTo})` : ""}\n${JSON.stringify(variables, null, 2)}`,
    )
    return
  }
  const id = RESEND_TEMPLATE_IDS[template]
  if (!id) throw new Error(`The "${template}" template isn't published yet. Run npm run emails:publish.`)

  const { error } = await resend(key).emails.send({
    from: process.env.RESEND_FROM_EMAIL || "VETUD <contact@vetud.com>",
    to: [to],
    template: { id, variables: withUnsubscribe(template, to, variables) },
    replyTo,
  })
  if (error) throw new Error(`Resend refused ${template} to ${to}: ${error.message}`)
}

/**
 * The Resend segment shared with the VETUD shop's newsletter ("VETUD Shop + BeSlimNow subscribers"; the
 * plan allows three segments). RESEND_SEGMENT_ID overrides it.
 */
const SEGMENT_ID = "3d111b05-4d1a-42fc-957d-ae3a4bb06b3f"
/** The "source" property on the contact, so the owner can see in Resend where they signed up. */
const SOURCE = "BeSlimNow pen page"

/**
 * Saves a subscriber as a Resend contact (Audience → Contacts) in the shared segment, with where they
 * came from, so the list can be mailed later with Resend Broadcasts. A new sign-up clears an earlier
 * unsubscribe: the person has just asked to hear from us again.
 */
export async function saveSubscriber(email: string, country?: string | null) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[contacts:dev] would add subscriber ${email}`)
    return
  }
  const segment = process.env.RESEND_SEGMENT_ID?.trim() || SEGMENT_ID
  const { error } = await resend(key).contacts.create({
    email,
    unsubscribed: false,
    properties: { source: SOURCE, ...(country ? { country } : {}) },
    segments: [{ id: segment }],
  })
  if (error && !/exist/i.test(error.message)) throw new Error(`Resend refused contact ${email}: ${error.message}`)
}

/** Marks a contact as unsubscribed in Resend, so no broadcast reaches them. An unknown contact is fine. */
export async function unsubscribeContact(email: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[contacts:dev] would unsubscribe ${email}`)
    return
  }
  const { error } = await resend(key).contacts.update({ email, unsubscribed: true })
  if (error && error.name !== "not_found") throw new Error(`Resend couldn't unsubscribe ${email}: ${error.message}`)
}

/** Sends the new-client welcome template (Tirzepatide & Retatrutide pens) to a new client. */
export async function sendNewClient(to: string, variables: Record<string, string>, replyTo?: string) {
  await sendTemplate({ template: "new-client", to, variables, replyTo })
}
