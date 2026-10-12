/**
 * European multi-currency setup.
 *
 * EUR is the store's default currency. The @kb0912/currency-exchange-plugin converts product
 * prices from EUR into every currency in CONVERTED_MARKETS (nightly, or with "Update Prices Now"
 * in Admin > Currency Exchange Settings). USD stays manually priced for the US region.
 */

export const BASE_CURRENCY = "eur"

/** Eurozone members as of 2026 (Bulgaria joined on 1 January 2026). */
export const EUROZONE_COUNTRIES = [
  "at", "be", "bg", "cy", "de", "ee", "es", "fi", "fr", "gr", "hr",
  "ie", "it", "lt", "lu", "lv", "mt", "nl", "pt", "si", "sk",
]

export type ConvertedMarket = {
  currency: string
  region: string
  countries: string[]
}

/** Non-euro currencies of the EU/EEA, the UK and Switzerland. */
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

export const CONVERTED_CURRENCIES = CONVERTED_MARKETS.map((market) => market.currency)

/** Locale used to format each currency (symbol position, separators). */
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

/** HUF and ISK are priced in whole units. */
const ZERO_DECIMAL_CURRENCIES = new Set(["huf", "isk"])

export function formatCurrency(amount: number, currencyCode: string) {
  const code = currencyCode.toLowerCase()
  const digits = ZERO_DECIMAL_CURRENCIES.has(code) ? 0 : 2
  return new Intl.NumberFormat(CURRENCY_LOCALES[code] ?? "en-US", {
    style: "currency",
    currency: code.toUpperCase(),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}
