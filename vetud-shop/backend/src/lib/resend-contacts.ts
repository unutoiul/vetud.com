import { Resend } from "resend"

/**
 * Newsletter subscribers copied into Resend (Audience → Contacts), so the owner can mail them with
 * Resend Broadcasts (owner request 2026-11-28). The shop's pop-up and the BeSlimNow pen page share one
 * segment (the plan allows three: this one, vetud.com's email list and the Holland press list); the
 * "source" property on each contact says where they signed up. The database stays the source of
 * truth: anyone who unsubscribes in the shop is taken out of the segment.
 */
export const RESEND_SHOP_SEGMENT_ID = "3d111b05-4d1a-42fc-957d-ae3a4bb06b3f"

/** The "source" property in Resend for each place people sign up. */
export const CONTACT_SOURCES = {
  shopPopup: "VETUD shop pop-up",
  beslimnow: "BeSlimNow pen page",
} as const

let client: Resend | null = null

/** Null without RESEND_API_KEY (local development): subscribers then stay in the database only. */
function resend() {
  const key = process.env.RESEND_API_KEY
  return key ? (client ??= new Resend(key)) : null
}

type ContactOptions = {
  country?: string | null
  /** True for a sign-up the person just made: clears an earlier Resend unsubscribe. */
  resubscribe?: boolean
}

/**
 * Adds or updates a subscriber in Resend and puts them in the shop's segment; safe to repeat.
 * Resend's own "unsubscribed" flag (set by the unsubscribe link of a Resend broadcast) is kept unless
 * `resubscribe` is true. (Creating a contact that already exists would clear the flag, so existing
 * contacts are updated instead.)
 */
export async function addShopContact(
  email: string,
  source: string,
  { country, resubscribe = false }: ContactOptions = {},
) {
  const api = resend()
  if (!api) return false
  const properties = { source, ...(country ? { country: country.toUpperCase() } : {}) }
  const updated = await api.contacts.update({ email, properties, ...(resubscribe ? { unsubscribed: false } : {}) })
  if (updated.error?.name === "not_found") {
    const created = await api.contacts.create({ email, properties, segments: [{ id: RESEND_SHOP_SEGMENT_ID }] })
    if (created.error) throw new Error(`Resend refused contact ${email}: ${created.error.message}`)
    return true
  }
  if (updated.error) throw new Error(`Resend couldn't update contact ${email}: ${updated.error.message}`)
  const added = await api.contacts.segments.add({ email, segmentId: RESEND_SHOP_SEGMENT_ID })
  if (added.error) throw new Error(`Resend couldn't add ${email} to the shop segment: ${added.error.message}`)
  return true
}

/** Takes an address out of the shop's segment. A contact that isn't there (or in Resend) is fine. */
export async function removeShopContact(email: string) {
  const api = resend()
  if (!api) return false
  const removed = await api.contacts.segments.remove({ email, segmentId: RESEND_SHOP_SEGMENT_ID })
  if (removed.error && removed.error.name !== "not_found") {
    throw new Error(`Resend couldn't remove ${email} from the shop segment: ${removed.error.message}`)
  }
  return true
}
