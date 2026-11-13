const ENTRY_KEY = "vetud_education_entry_v2"
const LEGACY_ENTRY_KEY = "vetud_education_entry_v1"

export type EntryVisitor = { adult: true }

/** Remember only the age confirmation for this tab's visit. Discard previously collected names. */
export function entryVisitor(): EntryVisitor | null {
  try {
    const saved = window.sessionStorage.getItem(ENTRY_KEY) ?? window.sessionStorage.getItem(LEGACY_ENTRY_KEY)
    window.sessionStorage.removeItem(LEGACY_ENTRY_KEY)
    const stored: unknown = JSON.parse(saved ?? "null")
    if (!stored || typeof stored !== "object" || !("adult" in stored) || stored.adult !== true) return null
    return rememberEntryVisitor(true)
  } catch {
    return null
  }
}

export function rememberEntryVisitor(adult: boolean): EntryVisitor | null {
  if (!adult) return null
  const visitor: EntryVisitor = { adult: true }
  try {
    window.sessionStorage.removeItem(LEGACY_ENTRY_KEY)
    window.sessionStorage.setItem(ENTRY_KEY, JSON.stringify(visitor))
  } catch {
    // React retains the completed introduction when browser storage is blocked.
  }
  return visitor
}
