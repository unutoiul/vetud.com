/**
 * The 18+ confirmation is saved in a cookie for a year (owner, 2026-11-28), so a visitor confirms
 * their age once per browser, not on every visit. Only "yes, 18 or older" is stored: no name, no
 * birth date. Older visits kept it for the tab only (sessionStorage); those are moved to the cookie.
 */
const ADULT_COOKIE = "vetud_adult"
const ADULT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const SESSION_KEYS = ["vetud_education_entry_v2", "vetud_education_entry_v1"]

export type EntryVisitor = { adult: true }

const ADULT: EntryVisitor = { adult: true }

function hasAdultCookie() {
  return document.cookie.split(";").some(part => part.trim() === `${ADULT_COOKIE}=1`)
}

/** Whether this browser has already confirmed the visitor is 18 or older. */
export function entryVisitor(): EntryVisitor | null {
  try {
    if (hasAdultCookie()) return ADULT
    // A confirmation from before the cookie, kept for this tab only: move it to the cookie.
    const saved = SESSION_KEYS.map(key => window.sessionStorage.getItem(key)).find(Boolean)
    const stored: unknown = JSON.parse(saved ?? "null")
    if (!stored || typeof stored !== "object" || !("adult" in stored) || stored.adult !== true) return null
    return rememberEntryVisitor(true)
  } catch {
    return null
  }
}

export function rememberEntryVisitor(adult: boolean): EntryVisitor | null {
  if (!adult) return null
  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${ADULT_COOKIE}=1; Max-Age=${ADULT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax${secure}`
    for (const key of SESSION_KEYS) window.sessionStorage.removeItem(key)
  } catch {
    // React keeps the confirmation for this visit when cookies or storage are blocked.
  }
  return ADULT
}
