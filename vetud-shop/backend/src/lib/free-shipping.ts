import { BASE_CURRENCY } from "./currencies"

/**
 * Free standard shipping over a cart total (owner request 2026-11-17: "200-300$, set from the shop").
 * The owner sets one amount in US dollars in Admin (Free shipping page). Each region gets it in its own
 * currency, converted at today's rate and rounded to a round number, in two places that must agree:
 *  - `region.metadata.free_shipping_threshold`, which the storefront shows (progress bar, product note);
 *  - a 0-priced Standard shipping price with the rule `item_total >= threshold`, which makes it free.
 */
export const FREE_SHIPPING_OPTION_TYPE = "standard"
export const MAX_FREE_SHIPPING_USD = 100_000

/** A round local amount: 215 €, 1,100 zł, 84,000 Ft. */
export function roundThreshold(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return null
  if (amount < 1_000) return Math.max(5, Math.round(amount / 5) * 5)
  if (amount < 10_000) return Math.round(amount / 50) * 50
  return Math.round(amount / 500) * 500
}

/** The threshold in each currency, from the USD amount; a currency without a rate is left out. */
export function freeShippingThresholds(amountUsd: number, currencies: string[], rates: Record<string, number>) {
  const thresholds: Record<string, number> = {}
  for (const currency of new Set(currencies.map((code) => code.toLowerCase()))) {
    const value = currency === BASE_CURRENCY ? amountUsd : roundThreshold(amountUsd * (rates[currency] ?? Number.NaN))
    if (value) thresholds[currency] = value
  }
  return thresholds
}
