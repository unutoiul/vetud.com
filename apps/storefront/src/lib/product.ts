import type { HttpTypes } from "@medusajs/types"
import type { ProductSort } from "./medusa/products"

export type ProductLot = {
  lot: string
  date?: string
  purity?: string
  coaUrl?: string
}

export type ArtKind = "series" | "blend" | "supply"

export type ProductMeta = {
  code: string
  accent: string
  purity?: string
  testing?: string
  imageAspectRatio?: string
  form?: string
  storage?: string
  ingredients?: string
  volume?: string
  concentration?: string
  lots: ProductLot[]
  artKind: ArtKind
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
    ingredients: str(metadata.ingredients),
    volume: str(metadata.volume),
    concentration: str(metadata.concentration),
    lots: parseLots(metadata.lots),
    artKind,
  }
}

/** Variants in Admin rank order; unranked variants fall back to price (smallest amount first). */
export function sortedVariants(product: HttpTypes.StoreProduct): HttpTypes.StoreProductVariant[] {
  const price = (variant: HttpTypes.StoreProductVariant) => variant.calculated_price?.calculated_amount ?? 0
  return [...(product.variants ?? [])].sort(
    (a, b) => (a.variant_rank ?? 0) - (b.variant_rank ?? 0) || price(a) - price(b)
  )
}

export function variantPrice(variant?: HttpTypes.StoreProductVariant | null) {
  const price = variant?.calculated_price
  if (!price || typeof price.calculated_amount !== "number") {
    return null
  }
  return {
    amount: price.calculated_amount,
    original: typeof price.original_amount === "number" ? price.original_amount : price.calculated_amount,
    currencyCode: price.currency_code ?? "usd",
  }
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

/** Locale per currency, so each region sees its familiar symbol position and separators. */
const CURRENCY_LOCALES: Record<string, string> = {
  usd: "en-US",
  eur: "en-IE",
  gbp: "en-GB",
  chf: "de-CH",
  sek: "sv-SE",
  nok: "nb-NO",
  dkk: "da-DK",
  pln: "pl-PL",
  czk: "cs-CZ",
  huf: "hu-HU",
  ron: "ro-RO",
  isk: "is-IS",
}
const ZERO_DECIMAL_CURRENCIES = new Set(["huf", "isk"])

/** `whole` drops the decimals, e.g. for "free shipping over £170". */
export function formatMoney(
  amount: number | null | undefined,
  currencyCode: string,
  { whole = false }: { whole?: boolean } = {}
) {
  const code = currencyCode.toLowerCase()
  const digits = whole || ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2
  return new Intl.NumberFormat(CURRENCY_LOCALES[code] ?? "en-US", {
    style: "currency",
    currency: code.toUpperCase(),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(amount ?? 0))
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
    default:
      // Catalog order follows the product code: VTD-01, VTD-02, ... VTD-B1, VTD-S1.
      return sorted.sort((a, b) =>
        readProductMeta(a).code.localeCompare(readProductMeta(b).code, "en", { numeric: true })
      )
  }
}
