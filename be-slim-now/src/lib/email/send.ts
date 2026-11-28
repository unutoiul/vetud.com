import "server-only"
import { Resend } from "resend"
import { RESEND_TEMPLATE_IDS } from "./template-ids"
import type { EmailTemplate } from "./templates"

let client: Resend | null = null
const resend = (key: string) => (client ??= new Resend(key))

type Email = {
  template: EmailTemplate
  to: string
  variables: Record<string, string>
  replyTo?: string
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
    template: { id, variables },
    replyTo,
  })
  if (error) throw new Error(`Resend refused ${template} to ${to}: ${error.message}`)
}

/**
 * Saves a subscriber as a Resend contact (Audience → Contacts), in RESEND_SEGMENT_ID when set, so the
 * list can be mailed later with Resend Broadcasts. Someone already on the list is not an error.
 */
export async function saveSubscriber(email: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[contacts:dev] would add subscriber ${email}`)
    return
  }
  const segment = process.env.RESEND_SEGMENT_ID?.trim()
  const { error } = await resend(key).contacts.create({
    email,
    unsubscribed: false,
    ...(segment ? { segments: [{ id: segment }] } : {}),
  })
  if (error && !/exist/i.test(error.message)) throw new Error(`Resend refused contact ${email}: ${error.message}`)
}
/** Sends the new-client welcome template (Tirzepatide & Retatrutide pens) to a new client. */
export async function sendNewClient(to: string, variables: Record<string, string>, replyTo?: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.info(`[email:dev] new-client ? ${to}
${JSON.stringify(variables, null, 2)}`)
    return
  }
  const id = RESEND_TEMPLATE_IDS["new-client"]
  if (!id) throw new Error('The "new-client" template isn\'t published yet. Run npm run emails:publish.')

  const { error } = await resend(key).emails.send({
    from: process.env.RESEND_FROM_EMAIL || "VETUD <contact@vetud.com>",
    to: [to],
    template: { id, variables },
    replyTo,
  })
  if (error) throw new Error(`Resend refused new-client to ${to}: ${error.message}`)
}
