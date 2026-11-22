import type { PriceListId } from "./site"

/**
 * The countries in the header's country picker: the United States and every European country we
 * ship to (Russia isn't in the shipping list, so it isn't here either). Each country names:
 *
 * - `prices`: the price list it pays (PRICE_LISTS in src/config/site.ts). Countries outside the
 *   euro area with a currency we don't price in (Iceland, the Western Balkans, Moldova, Ukraine,
 *   Belarus) pay in euros.
 * - `locale`: how people there write prices and numbers ("1.234 €", "€1,234", "1 234 kr"). It also
 *   gives the country's own name in the picker (Deutschland, Sverige…).
 *
 * Visitors from anywhere else, and orders shipped anywhere else, get US prices.
 */
export const MARKETS = {
  US: { prices: "USD", locale: "en-US" },
  AD: { prices: "EUR", locale: "ca-AD" },
  AL: { prices: "EUR", locale: "sq-AL" },
  AT: { prices: "EUR", locale: "de-AT" },
  BA: { prices: "EUR", locale: "bs-BA" },
  BE: { prices: "EUR", locale: "nl-BE" },
  BG: { prices: "EUR", locale: "bg-BG" },
  BY: { prices: "EUR", locale: "be-BY" },
  CH: { prices: "CHF", locale: "de-CH" },
  CY: { prices: "EUR", locale: "el-CY" },
  CZ: { prices: "CZK", locale: "cs-CZ" },
  DE: { prices: "EUR", locale: "de-DE" },
  DK: { prices: "DKK", locale: "da-DK" },
  EE: { prices: "EUR", locale: "et-EE" },
  ES: { prices: "EUR", locale: "es-ES" },
  FI: { prices: "EUR", locale: "fi-FI" },
  FR: { prices: "EUR", locale: "fr-FR" },
  GB: { prices: "GBP", locale: "en-GB" },
  GR: { prices: "EUR", locale: "el-GR" },
  HR: { prices: "EUR", locale: "hr-HR" },
  HU: { prices: "HUF", locale: "hu-HU" },
  IE: { prices: "EUR", locale: "en-IE" },
  IS: { prices: "EUR", locale: "is-IS" },
  IT: { prices: "EUR", locale: "it-IT" },
  LI: { prices: "CHF", locale: "de-LI" },
  LT: { prices: "EUR", locale: "lt-LT" },
  LU: { prices: "EUR", locale: "fr-LU" },
  LV: { prices: "EUR", locale: "lv-LV" },
  MC: { prices: "EUR", locale: "fr-MC" },
  MD: { prices: "EUR", locale: "ro-MD" },
  ME: { prices: "EUR", locale: "sr-Latn-ME" },
  MK: { prices: "EUR", locale: "mk-MK" },
  MT: { prices: "EUR", locale: "en-MT" },
  NL: { prices: "EUR", locale: "nl-NL" },
  NO: { prices: "NOK", locale: "nb-NO" },
  PL: { prices: "PLN", locale: "pl-PL" },
  PT: { prices: "EUR", locale: "pt-PT" },
  RO: { prices: "RON", locale: "ro-RO" },
  RS: { prices: "EUR", locale: "sr-RS" },
  SE: { prices: "SEK", locale: "sv-SE" },
  SI: { prices: "EUR", locale: "sl-SI" },
  SK: { prices: "EUR", locale: "sk-SK" },
  SM: { prices: "EUR", locale: "it-SM" },
  UA: { prices: "EUR", locale: "uk-UA" },
  VA: { prices: "EUR", locale: "it-VA" },
  XK: { prices: "EUR", locale: "sq-XK" },
} as const satisfies Record<string, { prices: PriceListId; locale: string }>

export type CountryCode = keyof typeof MARKETS

export const DEFAULT_COUNTRY: CountryCode = "US"

export const MARKET_CODES = Object.keys(MARKETS) as CountryCode[]

export const isMarket = (code: unknown): code is CountryCode => typeof code === "string" && Object.hasOwn(MARKETS, code)

/** Remembers the visitor's choice for a year; the proxy (src/proxy.ts) reads it. */
export const COUNTRY_COOKIE = "vetud_pens_country"
