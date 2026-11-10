import { MedusaError } from "@medusajs/framework/utils"

/**
 * Prices are set in US dollars only: product variants and shipping options each have one USD
 * price, edited in Admin. Every other currency is converted from it at the current exchange rate
 * by workflows/sync-currency-prices.ts (hourly, see jobs/sync-currency-prices.ts).
 */
export const BASE_CURRENCY = "usd"

/** Eurozone members as of 2026 (Bulgaria joined on 1 January 2026). */
export const EUROZONE_COUNTRIES = [
  "at", "be", "bg", "cy", "de", "ee", "es", "fi", "fr", "gr", "hr",
  "ie", "it", "lt", "lu", "lv", "mt", "nl", "pt", "si", "sk",
]

export type ConvertedMarket = { currency: string; region: string; countries: string[] }

/** Regions for the non-euro currencies of the EU/EEA, the UK and Switzerland. */
export const CONVERTED_MARKETS: ConvertedMarket[] = [
  { currency: "gbp", region: "United Kingdom", countries: ["gb"] },
  { currency: "chf", region: "Switzerland", countries: ["ch", "li"] },
  { currency: "sek", region: "Sweden", countries: ["se"] },
  { currency: "nok", region: "Norway", countries: ["no"] },
  { currency: "dkk", region: "Denmark", countries: ["dk"] },
  { currency: "pln", region: "Poland", countries: ["pl"] },
  { currency: "czk", region: "Czechia", countries: ["cz"] },
  { currency: "huf", region: "Hungary", countries: ["hu"] },
  { currency: "ron", region: "Romania", countries: ["ro"] },
  { currency: "isk", region: "Iceland", countries: ["is"] },
]

/** Decimal places Intl uses for the currency (2 for EUR, 0 for JPY). */
export function currencyDigits(currencyCode: string) {
  return new Intl.NumberFormat("en", { style: "currency", currency: currencyCode.toUpperCase() }).resolvedOptions().maximumFractionDigits ?? 2
}

/** Rounds to the currency's smallest unit: 68.6 USD stays 68.60, 8514.7 JPY becomes 8515. */
export function roundMoney(amount: number, currencyCode: string) {
  const factor = 10 ** currencyDigits(currencyCode)
  return Math.round(amount * factor) / factor
}

/** Amounts in emails and other English text, formatted by Intl (€48.00, ¥8,515). */
export function formatCurrency(amount: number, currencyCode: string, locale = "en") {
  return new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode.toUpperCase() }).format(amount)
}

// The free currency-api (daily rates from central banks and markets) and its CDN mirror.
const RATE_SOURCES = [
  `https://latest.currency-api.pages.dev/v1/currencies/${BASE_CURRENCY}.json`,
  `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${BASE_CURRENCY}.json`,
]
const RATE_CACHE_MS = 60 * 60 * 1000
let cachedRates: { rates: Record<string, number>; fetchedAt: number } | null = null

/** Today's rates from 1 USD, e.g. { eur: 0.86, gbp: 0.76 }, cached for an hour. */
export async function getExchangeRates(): Promise<Record<string, number>> {
  if (cachedRates && Date.now() - cachedRates.fetchedAt < RATE_CACHE_MS) return cachedRates.rates
  const errors: string[] = []
  for (const url of RATE_SOURCES) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
      if (!response.ok) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `HTTP ${response.status}`)
      const rates = ((await response.json()) as Record<string, unknown>)[BASE_CURRENCY]
      if (!rates || typeof rates !== "object") throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "no rates in the response")
      const clean = Object.fromEntries(Object.entries(rates).filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0))
      cachedRates = { rates: clean, fetchedAt: Date.now() }
      return clean
    } catch (error) {
      errors.push(`${new URL(url).host}: ${(error as Error).message}`)
    }
  }
  throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Exchange rates unavailable (${errors.join("; ")})`)
}
