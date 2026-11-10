/**
 * Since 2026-11-05 the currency doesn't depend on the country: a shopper in Sweden can pay in
 * dollars, euros or pounds. The choice lives in the CURRENCY_COOKIE. The address bar always shows
 * the country alone (/se/shop); when the cookie holds a currency other than the country's own, the
 * proxy rewrites the request to a hidden segment (/se-usd/shop). Each country and currency pair is
 * then a static page of its own, rendered once and cached, without reading cookies while rendering.
 */
export const CURRENCIES = ["usd", "eur", "gbp"] as const
export type StoreCurrency = (typeof CURRENCIES)[number]

export const CURRENCY_COOKIE = "vetud_currency"

const SEGMENT = /^([a-z]{2})(?:-(usd|eur|gbp))?$/

export function isStoreCurrency(value: string | undefined | null): value is StoreCurrency {
  return Boolean(value) && (CURRENCIES as readonly string[]).includes(value as string)
}

/** "se" → Sweden in its own currency; "se-usd" → Sweden in US dollars. */
export function parseStoreSegment(segment: string): { country: string; currency: StoreCurrency | null } {
  const match = SEGMENT.exec(segment.toLowerCase())
  if (!match) return { country: segment.toLowerCase(), currency: null }
  return { country: match[1], currency: (match[2] as StoreCurrency | undefined) ?? null }
}

/** The segment the proxy rewrites to: the country alone when the currency is its own. */
export function storeSegment(country: string, currency: StoreCurrency | null, homeCurrency?: string) {
  return currency && currency !== homeCurrency ? `${country}-${currency}` : country
}
