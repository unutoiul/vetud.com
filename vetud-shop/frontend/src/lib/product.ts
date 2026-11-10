import type { HttpTypes } from "@medusajs/types"
import type { ProductSort } from "./medusa/products"
import { SITE } from "./config"
import { popularity } from "./popularity"
import { merchandisingPriority } from "./product-merchandising"

export type ProductLot = {
  lot: string
  date?: string
  purity?: string
  coaUrl?: string
}

export type ArtKind = "series" | "blend" | "supply"

/**
 * The notice on a product's purchase panel, card and overview. It lives in the product's metadata,
 * so it can be changed per product in Medusa Admin: `notice_title` (the bold lead) and `notice_text`.
 * Products with neither show the research-use notice; `notice_title: "none"` shows no notice.
 */
export type ProductNotice = { title: string; text: string; research: boolean }

export const RESEARCH_NOTICE: ProductNotice = { title: SITE.productDisclaimer, text: SITE.ruoNotice, research: true }

export function readProductNotice(metadata: Record<string, unknown> | null | undefined): ProductNotice | null {
  const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : undefined)
  const title = text(metadata?.notice_title)
  const body = text(metadata?.notice_text)
  if (title?.toLowerCase() === "none") return null
  return title || body ? { title: title ?? "", text: body ?? "", research: false } : RESEARCH_NOTICE
}

export type ProductMeta = {
  code: string
  accent: string
  purity?: string
  testing?: string
  imageAspectRatio?: string
  form?: string
  storage?: string
  stability?: string
  handling?: string
  features: string[]
  ingredients?: string
  volume?: string
  concentration?: string
  lots: ProductLot[]
  artKind: ArtKind
  /** null when the product shows no notice. */
  notice: ProductNotice | null
}

const DEFAULT_ACCENT = "#3cc7c2"

/**
 * Lots live in product metadata as `LOT|YYYY-MM|PURITY|COA_URL` entries separated by ";"
 * (editable in Medusa Admin). A JSON array of objects is accepted as well.
 */
export function parseLots(value: unknown): ProductLot[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry && typeof entry === "object" && typeof entry.lot === "string")
      .map((entry) => ({
        lot: String(entry.lot).trim(),
        date: entry.date ? String(entry.date) : undefined,
        purity: entry.purity ? String(entry.purity) : undefined,
        coaUrl: entry.coa_url ? String(entry.coa_url) : undefined,
      }))
  }
  if (typeof value !== "string") {
    return []
  }
  return value
    .split(/[;\n]/)
    .map((entry) => entry.split("|").map((part) => part.trim()))
    .filter(([lot]) => Boolean(lot))
    .map(([lot, date, purity, coaUrl]) => ({
      lot,
      date: date || undefined,
      purity: purity || undefined,
      coaUrl: coaUrl || undefined,
    }))
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

export function readProductMeta(
  product: Pick<HttpTypes.StoreProduct, "metadata" | "categories" | "title">
): ProductMeta {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const categoryHandles = (product.categories ?? []).map((category) => category.handle)
  const artKind: ArtKind = categoryHandles.includes("blends")
    ? "blend"
    : categoryHandles.includes("lab-supplies")
      ? "supply"
      : "series"

  return {
    code: str(metadata.code) ?? "VTD",
    accent: /^#[0-9a-f]{6}$/i.test(String(metadata.accent)) ? String(metadata.accent) : DEFAULT_ACCENT,
    purity: str(metadata.purity),
    testing: str(metadata.testing),
    imageAspectRatio: ["4 / 3", "4 / 5", "1 / 1"].includes(String(metadata.image_aspect_ratio)) ? String(metadata.image_aspect_ratio) : undefined,
    form: str(metadata.form),
    storage: str(metadata.storage),
    stability: str(metadata.stability),
    handling: str(metadata.handling),
    features: Array.isArray(metadata.features) ? metadata.features.filter((value): value is string => typeof value === "string" && Boolean(value.trim())) : [],
    ingredients: str(metadata.ingredients),
    volume: str(metadata.volume),
    concentration: str(metadata.concentration),
    lots: parseLots(metadata.lots),
    artKind,
    notice: readProductNotice(metadata),
  }
}

/** Variants in Admin rank order; unranked variants fall back to price (smallest amount first). */
export function sortedVariants(product: HttpTypes.StoreProduct): HttpTypes.StoreProductVariant[] {
  const price = (variant: HttpTypes.StoreProductVariant) => variant.calculated_price?.calculated_amount ?? 0
  return [...(product.variants ?? [])].sort(
    (a, b) => (a.variant_rank ?? 0) - (b.variant_rank ?? 0) || price(a) - price(b)
  )
}

/** The variant's price in the region's currency, as Medusa calculated it. */
export function variantPrice(variant?: HttpTypes.StoreProductVariant | null) {
  const price = variant?.calculated_price
  if (!price || typeof price.calculated_amount !== "number" || !price.currency_code) {
    return null
  }
  return {
    amount: price.calculated_amount,
    original: typeof price.original_amount === "number" ? price.original_amount : price.calculated_amount,
    currencyCode: price.currency_code,
  }
}

/** The whole percentage a sale takes off the regular price (30 for 98 → 68.60), or 0 when there's no sale. */
export function percentOff(price?: { amount: number; original: number } | null) {
  if (!price || !(price.original > price.amount)) return 0
  return Math.round((1 - price.amount / price.original) * 100)
}

export function cheapestPrice(product: HttpTypes.StoreProduct) {
  const prices = (product.variants ?? [])
    .map((variant) => variantPrice(variant))
    .filter((price): price is NonNullable<ReturnType<typeof variantPrice>> => price !== null)
  if (!prices.length) {
    return null
  }
  const cheapest = prices.reduce((min, price) => (price.amount < min.amount ? price : min))
  return { ...cheapest, hasRange: prices.some((price) => price.amount !== cheapest.amount) }
}

export function isVariantInStock(variant?: HttpTypes.StoreProductVariant | null) {
  if (!variant) {
    return false
  }
  if (!variant.manage_inventory || variant.allow_backorder) {
    return true
  }
  return (variant.inventory_quantity ?? 0) > 0
}

export function isProductInStock(product: HttpTypes.StoreProduct) {
  return (product.variants ?? []).some((variant) => isVariantInStock(variant))
}

/** Shared by the purchase panel and search data so both describe the same option. */
export function initialProductVariant(product: HttpTypes.StoreProduct) {
  const variants = sortedVariants(product)
  return variants.find(variant => isVariantInStock(variant)) ?? variants[0]
}

export function sortProducts(products: HttpTypes.StoreProduct[], sort: ProductSort) {
  const price = (product: HttpTypes.StoreProduct) => cheapestPrice(product)?.amount ?? Infinity
  const sorted = [...products]
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => price(a) - price(b))
    case "price-desc":
      return sorted.sort((a, b) => price(b) - price(a))
    case "name":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, "en", { numeric: true }))
    case "relevance":
      // Store-selected labels lead; public prominence then breaks ties.
      return sorted.sort((a, b) => merchandisingPriority(b) - merchandisingPriority(a) || popularity(b) - popularity(a) || featuredOrder(a, b))
    default:
      return sorted.sort(featuredOrder)
  }
}

/** Branded materials lead the collection, then product code order; all other entries are kept. */
function featuredOrder(a: HttpTypes.StoreProduct, b: HttpTypes.StoreProduct) {
  return Number(b.metadata?.brand === "VETUD") - Number(a.metadata?.brand === "VETUD") ||
    readProductMeta(a).code.localeCompare(readProductMeta(b).code, "en", { numeric: true })
}
