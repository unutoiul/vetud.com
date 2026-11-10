/** Owner-selected merchandising labels, not an automatic sales ranking. */
export const PRODUCT_MERCHANDISING: Record<string, { very_popular: boolean; best_seller: boolean }> = {
  retatrutide: { very_popular: true, best_seller: true },
  tirzepatide: { very_popular: true, best_seller: true },
  "melanotan-ii": { very_popular: true, best_seller: true },
  semaglutide: { very_popular: true, best_seller: true },
  "bpc-157": { very_popular: true, best_seller: true },
  "ghk-cu": { very_popular: true, best_seller: true },
  "tb-500": { very_popular: true, best_seller: false },
  ipamorelin: { very_popular: true, best_seller: false },
}

export const MERCHANDISING_SELECTION_REVISION = "2026-11-11-expanded"

/** Apply the owner's revised selection once, then preserve subsequent Admin edits on reruns. */
export function withExpandedMerchandising(handle: string, metadata: Record<string, unknown> = {}) {
  const selection = PRODUCT_MERCHANDISING[handle]
  if (!selection || metadata.merchandising_selection_revision === MERCHANDISING_SELECTION_REVISION) return metadata
  return { ...metadata, ...selection, merchandising_selection_revision: MERCHANDISING_SELECTION_REVISION }
}

/** Fill missing flags once; explicit Admin choices (including false) always win. */
export function withMerchandisingDefaults(handle: string, metadata: Record<string, unknown> = {}) {
  const defaults = PRODUCT_MERCHANDISING[handle]
  if (!defaults) return metadata
  return {
    ...metadata,
    very_popular: metadata.very_popular ?? defaults.very_popular,
    best_seller: metadata.best_seller ?? defaults.best_seller,
  }
}
