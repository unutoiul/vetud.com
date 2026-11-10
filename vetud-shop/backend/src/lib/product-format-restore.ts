import { createHash } from "node:crypto"

export const FORMAT_RESTORE_REVISION = "original-catalog-restored-2026-11-09-v1"
export type RestoreVariant = { id: string; sku: string; priceSetId: string; priceDigest: string; options: [string, string][] }
export type RestoreProduct = {
  id: string; handle: string; description: string; thumbnail: string
  metadata: Record<string, unknown>; images: { url: string }[]
  variants: RestoreVariant[]; formats: string[]
}
export type PriceVariant = { id: string; sku?: string | null; options?: { value: string; option?: { title: string } }[]; price_set?: { id: string; prices?: { id: string; currency_code: string; amount: number; price_list_id?: string | null }[] } | null }

export function variantPriceDigest(variant: PriceVariant) {
  const prices = (variant.price_set?.prices ?? []).map(price => [price.id, price.currency_code, price.amount, price.price_list_id ?? null])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
  return createHash("sha256").update(JSON.stringify(prices)).digest("hex")
}

/** Undo only the packaging paragraphs added by the blanket review, preserving other current copy. */
export function restoredPackagingDescription(current: string, original: string) {
  const paragraphs = current.split(/\n\s*\n/)
  const kept = paragraphs.filter(text => !/^(Supplied as sealed research material|Available as a research vial or nasal-spray|Supplied in a bottle for laboratory research)/.test(text))
  const originalPackaging = original.split(/\n\s*\n/).filter(text => /^Choose a dual-chamber/.test(text))
  return [...kept, ...originalPackaging.filter(text => !kept.includes(text))].join("\n\n")
}

export function restoredFormatMetadata(current: Record<string, unknown>, source: RestoreProduct): Record<string, unknown> {
  const keys = ["form", "contents_pen", "contents_box", "contents_vial", "format_line_pen", "format_line_box", "format_line_vial"]
  return {
    ...current,
    ...Object.fromEntries(keys.map(key => [key, source.metadata[key] ?? null])),
    allowed_formats: source.formats,
    format_restore_revision: FORMAT_RESTORE_REVISION,
    format_review_basis: "Original catalog packaging restored at the owner's request after the blanket removal was reversed. Packaging availability does not certify administration suitability.",
  }
}
