import { DEFAULT_COUNTRY, MARKETS, isMarket, type CountryCode } from "@/config/markets"
import { OFFER, PRICE_LISTS, PRODUCT_IDS, STRENGTHS, type ProductId, type Strength } from "@/config/site"

/**
 * Prices by country, shared by the page (client) and POST /api/order (server), so both always
 * agree. A country in the picker pays its own price list; any other country pays US prices.
 */

export const pricingCountry = (code?: string | null): CountryCode => {
  const upper = code?.toUpperCase()
  return isMarket(upper) ? upper : DEFAULT_COUNTRY
}

const listOf = (country: CountryCode) => PRICE_LISTS[MARKETS[country].prices]

export const currencyOf = (country: CountryCode): string => listOf(country).currency

/** Regular price and the offer price buyers pay, in whole units of the country's currency. */
export function priceOf(product: ProductId, strength: Strength, country: CountryCode) {
  const regular: number = listOf(country).prices[product][strength]
  return { regular, sale: Math.round(regular * (1 - OFFER.salePercent / 100)) }
}

/** Offer price per mg, for the "best value" tag. */
export const pricePerMg = (product: ProductId, strength: Strength, country: CountryCode) =>
  priceOf(product, strength, country).sale / parseInt(strength, 10)

/** The lowest offer price on the page ("from …"). */
export const lowestPrice = (country: CountryCode) =>
  Math.min(...PRODUCT_IDS.flatMap((id) => STRENGTHS.map((strength) => priceOf(id, strength, country).sale)))

const formatters = new Map<string, Intl.NumberFormat>()

/**
 * An amount the way people in that country write it: "$239", "203 €", "€203", "2 274 kr", "CHF 191", "1.043 lei".
 * Whole units, except small per-mg amounts, which keep two decimals.
 */
export function formatPrice(amount: number, country: CountryCode) {
  const digits = Math.abs(amount) < 100 && !Number.isInteger(amount) ? 2 : 0
  const { locale } = MARKETS[country]
  const currency = currencyOf(country)
  const key = `${locale}|${currency}|${digits}`
  let formatter = formatters.get(key)
  if (!formatter) {
    // narrowSymbol: "€" rather than "EUR" in Iceland or Ukraine, "lei" in Romania.
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
    formatters.set(key, formatter)
  }
  return formatter.format(amount)
}

/** For emails: the local format plus the currency code when the symbol alone is ambiguous ("2 274 kr (SEK)"). */
export function formatPriceWithCode(amount: number, country: CountryCode) {
  const text = formatPrice(amount, country)
  const currency = currencyOf(country)
  return text.includes(currency) ? text : `${text} (${currency})`
}
