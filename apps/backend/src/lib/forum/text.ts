/** Keep paragraphs, but no more than one blank line between them, and no invisible control characters. */
export function normalizeBody(text: string) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f​-‏‪-‮⁦-⁩]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function normalizeTitle(text: string) {
  return normalizeBody(text).replace(/\s+/g, " ")
}

/** "Week 12 on BPC-157: recovery notes" → "week-12-on-bpc-157-recovery-notes". */
export function slugify(text: string, max = 80, fallback = "thread") {
  const slug = text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "")
  return slug || fallback
}

export function excerptOf(body: string, max = 220) {
  const flat = body.replace(/\s+/g, " ").trim()
  if (flat.length <= max) return flat
  const cut = flat.slice(0, max)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).trimEnd()}…`
}

/** "Lucas Franco" → "Lucas F.": the suggested community name. Members can change it. */
export function suggestedDisplayName(first?: string | null, last?: string | null) {
  const given = first?.trim()
  const initial = last?.trim().charAt(0).toUpperCase()
  if (!given) return ""
  return initial ? `${given} ${initial}.` : given
}

export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} ._'-]{1,30}[\p{L}\p{N}.]$/u

const RESERVED = ["vetud", "admin", "administrator", "moderator", "staff", "support", "official", "team"]

/**
 * The member's URL handle. Names without Latin letters or digits ("Иван") get a random handle,
 * so they don't all collide on the same one.
 */
export function handleFor(displayName: string, random: () => string = () => Math.random().toString(36).slice(2, 8)) {
  const handle = slugify(displayName, 32, "")
  return handle.length >= 3 ? handle : `member-${random()}`
}

/** Names that could pass for staff are kept for the team. */
export function isReservedHandle(handle: string) {
  return handle.split("-").some(part => RESERVED.includes(part))
}
