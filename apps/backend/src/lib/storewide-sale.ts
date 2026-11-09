import type { CreatePriceListPriceWorkflowDTO, UpdatePriceListPriceWorkflowDTO } from "@medusajs/framework/types"
import { roundMoney } from "./currencies"

/**
 * A store-wide sale is a Medusa price list (type "sale") that takes the same percentage off every
 * variant's regular price, in every currency. Admin > Sales manages them; the percentage lives in
 * the price list's metadata under this key, and the prices are recalculated from it.
 */
export const SALE_METADATA_KEY = "storewide_sale"

/**
 * Products with `sale_excluded: true` in their metadata stay at full price: the sale gives their
 * variants no price, and removes any it gave them before (owner request 2026-11-09, retail serums).
 */
export const SALE_EXCLUDED_KEY = "sale_excluded"

/** Admin's metadata editor may store the flag as the text "true", so both count. */
export const isSaleExcluded = (metadata: Record<string, unknown> | null | undefined) => {
  const value = metadata?.[SALE_EXCLUDED_KEY]
  return value === true || (typeof value === "string" && value.trim().toLowerCase() === "true")
}

export const MIN_PERCENT_OFF = 1
export const MAX_PERCENT_OFF = 90

export type SaleSettings = { percent_off: number }

/** The sale settings stored on a price list, or null for price lists Admin > Sales doesn't manage. */
export function readSaleSettings(metadata: Record<string, unknown> | null | undefined): SaleSettings | null {
  const value = metadata?.[SALE_METADATA_KEY]
  if (!value || typeof value !== "object") return null
  const percent = (value as Record<string, unknown>).percent_off
  return typeof percent === "number" && Number.isFinite(percent) ? { percent_off: percent } : null
}

/** 30% off 98 USD is 68.60; currencies without decimals (JPY) round to the unit. */
export function saleAmount(amount: number, percentOff: number, currencyCode: string) {
  return roundMoney((amount * (100 - percentOff)) / 100, currencyCode)
}

export type PriceRow = {
  id: string
  amount: number | string
  currency_code: string
  price_list_id?: string | null
  min_quantity?: number | string | null
  max_quantity?: number | string | null
  rules_count?: number | null
}

export type VariantPrices = { id: string; price_set?: { prices?: (PriceRow | null)[] | null } | null; excluded?: boolean }

export type SalePricePlan = {
  create: CreatePriceListPriceWorkflowDTO[]
  update: UpdatePriceListPriceWorkflowDTO[]
  delete: string[]
}

/** The regular price: not from a price list, no region or quantity rules. */
const isRegularPrice = (price: PriceRow) =>
  !price.price_list_id && !price.rules_count && (price.min_quantity == null || Number(price.min_quantity) <= 1) && price.max_quantity == null

/**
 * Brings a sale price list in line with the catalog: one price per variant and currency, the
 * regular price less the percentage. Existing prices are updated in place, missing ones created,
 * and prices for currencies a variant no longer has (or duplicates) removed. A new sale passes null.
 */
export function planSalePrices(variants: VariantPrices[], priceListId: string | null, percentOff: number): SalePricePlan {
  const plan: SalePricePlan = { create: [], update: [], delete: [] }
  for (const variant of variants) {
    const prices = (variant.price_set?.prices ?? []).filter((price): price is PriceRow => !!price)
    const regular = new Map<string, number>()
    for (const price of prices) {
      const currency = price.currency_code.toLowerCase()
      if (!variant.excluded && isRegularPrice(price) && !regular.has(currency)) regular.set(currency, Number(price.amount))
    }
    const current = new Map<string, PriceRow>()
    for (const price of priceListId ? prices.filter((item) => item.price_list_id === priceListId) : []) {
      const currency = price.currency_code.toLowerCase()
      if (!regular.has(currency) || current.has(currency)) plan.delete.push(price.id)
      else current.set(currency, price)
    }
    for (const [currency, amount] of regular) {
      if (!(amount > 0)) continue
      const target = saleAmount(amount, percentOff, currency)
      const existing = current.get(currency)
      if (!existing) plan.create.push({ variant_id: variant.id, currency_code: currency, amount: target })
      // The currency is required: Medusa matches price list updates by price set and currency, so
      // without it every update for a variant collapses into one.
      else if (Math.abs(Number(existing.amount) - target) > 0.000001) plan.update.push({ id: existing.id, variant_id: variant.id, currency_code: currency, amount: target })
    }
  }
  return plan
}

export type SaleState = "live" | "scheduled" | "ended" | "off"

/** What a shopper sees right now: Medusa applies an active price list only between its dates. */
export function saleState(sale: { status?: string | null; starts_at?: string | Date | null; ends_at?: string | Date | null }, now = new Date()): SaleState {
  if (sale.status !== "active") return "off"
  if (sale.ends_at && new Date(sale.ends_at) <= now) return "ended"
  if (sale.starts_at && new Date(sale.starts_at) > now) return "scheduled"
  return "live"
}

export const saleDescription = (percentOff: number) =>
  `${percentOff}% off every product, in every currency. Managed in Admin > Sales: prices here are recalculated from the regular prices, so edit the sale there rather than these prices.`
