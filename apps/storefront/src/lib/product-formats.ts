import type { HttpTypes } from "@medusajs/types"
import { initialProductVariant, isVariantInStock, sortedVariants } from "./product"
import { isUnsupportedInjectionFormat } from "./product-format-policy"

type Variant = HttpTypes.StoreProductVariant

/**
 * The ways a dual-chamber product is sold, keyed by the Medusa "Format" option value. The key order
 * is the order shown on the product page (pen kit box, dual-chamber vial, vial); the first is preselected.
 * Selank and Semax have the nasal spray in the pen kit box's place, so it shares the "box" key
 * (metadata `contents_box`).
 */
export const FORMAT_INFO: Record<string, { line: string; key: "pen" | "box" | "vial" }> = {
  "Pen kit box": { line: "The reusable pen with a dual-chamber vial, 12 needles and a booklet, in the VETUD box", key: "box" },
  "Nasal spray": { line: "A 10 ml nasal spray bottle in the VETUD box", key: "box" },
  "Dual-chamber vial": { line: "Powder and BAC water in one two-chamber cartridge. Refills the reusable pen", key: "pen" },
  // The cartridge's name until 2026-11-04, kept so older carts and the catalog in between still read well.
  "Dual-chamber pen": { line: "Powder and BAC water in one two-chamber cartridge", key: "pen" },
  Vial: { line: "Sealed research vial; no diluent or administration supplies included", key: "vial" },
}

export const KIT_FORMAT = "Pen kit box"

export const SPRAY_FORMAT = "Nasal spray"

export const FORMAT_OPTION = "Format"

export type ProductOption = { title: string; values: string[] }

const optionValue = (variant: Variant, title: string) =>
  variant.options?.find((option) => option.option?.title === title)?.value

/** Options in the order the variants use them, each value in variant order. */
export function readOptions(product: HttpTypes.StoreProduct): ProductOption[] {
  const options: ProductOption[] = []
  for (const variant of sortedVariants(product)) {
    if (isUnsupportedInjectionFormat(optionValue(variant, FORMAT_OPTION) ?? variant.title ?? "")) continue
    for (const option of variant.options ?? []) {
      const title = option.option?.title
      if (!title || !option.value) continue
      const entry = options.find((item) => item.title === title) ?? options[options.push({ title, values: [] }) - 1]
      if (!entry.values.includes(option.value)) entry.values.push(option.value)
    }
  }
  // Formats come first, in FORMAT_INFO order; amounts follow variant order (cheapest first).
  const known = Object.keys(FORMAT_INFO)
  const rank = (value: string) => (known.includes(value) ? known.indexOf(value) : known.length)
  for (const option of options) if (option.title === FORMAT_OPTION) option.values.sort((a, b) => rank(a) - rank(b))
  return options.sort((a, b) => Number(b.title === FORMAT_OPTION) - Number(a.title === FORMAT_OPTION))
}

/** The variant shown first: the smallest pen kit box in stock, or the usual first variant. */
export function defaultVariant(product: HttpTypes.StoreProduct) {
  const format = readOptions(product).find((option) => option.title === FORMAT_OPTION)?.values[0]
  const candidates = format ? variantsWith(product, FORMAT_OPTION, format) : []
  return candidates.find(isVariantInStock) ?? candidates[0] ?? initialProductVariant(product)
}

export function selectionOf(variant: Variant | undefined): Record<string, string> {
  return Object.fromEntries((variant?.options ?? []).flatMap((option) => option.option?.title && option.value ? [[option.option.title, option.value]] : []))
}

export function findVariant(product: HttpTypes.StoreProduct, selection: Record<string, string>) {
  return sortedVariants(product).find((variant) => Object.entries(selection).every(([title, value]) => optionValue(variant, title) === value))
}

/** Variants that match a partial selection, e.g. every amount of the vial. */
export function variantsWith(product: HttpTypes.StoreProduct, title: string, value: string) {
  return sortedVariants(product).filter((variant) => optionValue(variant, title) === value)
}

export function formatOf(variant: Variant | undefined) {
  return variant ? optionValue(variant, FORMAT_OPTION) : undefined
}

export function hasFormats(product: HttpTypes.StoreProduct) {
  return readOptions(product).some((option) => option.title === FORMAT_OPTION)
}

/** "Pen kit box: 5 mg, 10 mg · Dual-chamber vial: 5 mg, 10 mg · Vial: 5 mg, 10 mg", or the plain variant titles. */
export function availabilitySummary(product: HttpTypes.StoreProduct, separator = " · ") {
  const formats = readOptions(product).find((option) => option.title === FORMAT_OPTION)
  if (!formats) return sortedVariants(product).map((variant) => variant.title).join(", ")
  return formats.values.map((format) => `${format}: ${variantsWith(product, FORMAT_OPTION, format).map((variant) => optionValue(variant, "Amount") ?? variant.title).join(", ")}`).join(separator)
}

function formatMetadata(product: HttpTypes.StoreProduct, prefix: string, format: string) {
  const key = FORMAT_INFO[format]?.key
  const value = key ? product.metadata?.[`${prefix}_${key}`] : undefined
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

/** What's included in a format: product metadata `contents_pen` / `contents_box` / `contents_vial` (editable in Admin). */
export function formatContents(product: HttpTypes.StoreProduct, format: string) {
  return formatMetadata(product, "contents", format)
}

/** The format card's one-liner: metadata `format_line_pen` / `format_line_vial`, else the shared copy. */
export function formatLine(product: HttpTypes.StoreProduct, format: string) {
  return formatMetadata(product, "format_line", format) ?? FORMAT_INFO[format]?.line
}

/** The product's boxed format, "Pen kit box" or "Nasal spray", if it has one. */
export function boxedFormat(product: HttpTypes.StoreProduct) {
  return readOptions(product).find((option) => option.title === FORMAT_OPTION)?.values.find((value) => FORMAT_INFO[value]?.key === "box")
}

/** One short line for cards: "Pen kit, dual-chamber vial or vial · 5 mg / 10 mg", or the variant titles. */
export function shortAvailability(product: HttpTypes.StoreProduct, translate: (text: string) => string = text => text) {
  const options = readOptions(product)
  if (!options.some((option) => option.title === FORMAT_OPTION)) return sortedVariants(product).map((variant) => translate(variant.title ?? "")).join(" / ")
  const formats = options.find((option) => option.title === FORMAT_OPTION)?.values ?? []
  const amounts = options.find((option) => option.title !== FORMAT_OPTION)?.values ?? []
  const label = formats.map(translate).join(" / ")
  return `${label}${amounts.length ? ` · ${amounts.join(" / ")}` : ""}`
}
