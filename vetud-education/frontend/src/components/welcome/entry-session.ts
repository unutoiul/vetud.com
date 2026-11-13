const ENTRY_KEY = "vetud_education_entry_v1"
const NAME_LIMIT = 80

export type EntryVisitor = { name: string; adult: true }

export function entryName(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, NAME_LIMIT)
}

/** Keep this visit's introduction in the current tab, without creating an account. */
export function entryVisitor(): EntryVisitor | null {
  try {
    const stored: unknown = JSON.parse(window.sessionStorage.getItem(ENTRY_KEY) ?? "null")
    if (!stored || typeof stored !== "object" || !("name" in stored) || !("adult" in stored)) return null
    if (typeof stored.name !== "string" || stored.adult !== true || !entryName(stored.name)) return null
    return { name: entryName(stored.name), adult: true }
  } catch {
    return null
  }
}

export function rememberEntryVisitor(name: string, adult: boolean): EntryVisitor | null {
  const normalized = entryName(name)
  if (!normalized || !adult) return null
  const visitor: EntryVisitor = { name: normalized, adult: true }
  try {
    window.sessionStorage.setItem(ENTRY_KEY, JSON.stringify(visitor))
  } catch {
    // React retains the completed introduction when browser storage is blocked.
  }
  return visitor
}
