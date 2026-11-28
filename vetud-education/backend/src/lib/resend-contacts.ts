import { Resend } from "resend"

/**
 * The vetud.com email list, copied into Resend (Audience → Contacts) so the owner can mail it with
 * Resend Broadcasts (owner request 2026-11-28). The database stays the source of truth: confirmed
 * subscribers are in the segment below, and anyone who unsubscribes on vetud.com is taken out of it.
 * The shop's subscribers are in a different segment and never mixed with this one.
 */
export const RESEND_LIST_SEGMENT_ID = "4adda1b4-8e20-4d1e-8cbd-8119dd0952de"

/** Shown on each contact in Resend (property "source"), so the owner can see where they came from. */
export const RESEND_LIST_SOURCE = "vetud.com email list"

let client: Resend | null = null

/** Null without RESEND_API_KEY (local development): the list then stays in the database only. */
function resend() {
  const key = process.env.RESEND_API_KEY
  return key ? (client ??= new Resend(key)) : null
}

/**
 * Adds or updates a confirmed subscriber in Resend and puts them in the email-list segment; safe to
 * repeat. Resend's own "unsubscribed" flag (set by the unsubscribe link of a Resend broadcast) is kept,
 * except when `resubscribe` is true: the person has just confirmed a new sign-up themselves.
 * (Creating a contact that already exists would clear the flag, so existing contacts are updated.)
 */
export async function addListContact(email: string, locale: string, { resubscribe = false } = {}) {
  const api = resend()
  if (!api) return false
  const properties = { source: RESEND_LIST_SOURCE, language: locale }
  const updated = await api.contacts.update({ email, properties, ...(resubscribe ? { unsubscribed: false } : {}) })
  if (updated.error?.name === "not_found") {
    const created = await api.contacts.create({ email, properties, segments: [{ id: RESEND_LIST_SEGMENT_ID }] })
    if (created.error) throw new Error(`Resend refused contact ${email}: ${created.error.message}`)
    return true
  }
  if (updated.error) throw new Error(`Resend couldn't update contact ${email}: ${updated.error.message}`)
  const added = await api.contacts.segments.add({ email, segmentId: RESEND_LIST_SEGMENT_ID })
  if (added.error) throw new Error(`Resend couldn't add ${email} to the email list: ${added.error.message}`)
  return true
}

/** Takes an address out of the email-list segment. A contact that isn't there (or in Resend) is fine. */
export async function removeListContact(email: string) {
  const api = resend()
  if (!api) return false
  const removed = await api.contacts.segments.remove({ email, segmentId: RESEND_LIST_SEGMENT_ID })
  if (removed.error && removed.error.name !== "not_found") {
    throw new Error(`Resend couldn't remove ${email} from the email list: ${removed.error.message}`)
  }
  return true
}
