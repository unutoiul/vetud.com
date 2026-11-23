import { DEFAULT_COUNTRY, MARKETS, MARKET_CODES, type CountryCode } from "@/config/markets"
import { SITE } from "@/config/site"

/**
 * How search engines see the country pages. Each country's page (/de, /fr, /gb…) is its own
 * translation with its own prices, so each is indexed at its own address and they're tied together
 * with hreflang. The US page is "/" (and /us points there). Kosovo's page is the same Albanian,
 * euro-priced page as Albania's, and XK isn't an ISO country code that hreflang accepts, so /xk
 * points at /al.
 */
const CANONICAL_OF: Partial<Record<CountryCode, CountryCode>> = { XK: "AL" }

/** The address search engines should index for a country's page: "/" for the US, "/de"… for the rest. */
export function pagePath(country: CountryCode): string {
  const target = CANONICAL_OF[country] ?? country
  return target === DEFAULT_COUNTRY ? "/" : `/${target.toLowerCase()}`
}

/** The full address of a country's indexed page. */
export const pageUrl = (country: CountryCode) => `${SITE.url}${pagePath(country) === "/" ? "" : pagePath(country)}`

/**
 * hreflang value: the market's language and country ("de-AT"). Google takes an ISO 639-1 language
 * and an ISO 3166-1 country, so a script in the locale is dropped (sr-Latn-ME → sr-ME).
 */
function hreflang(country: CountryCode): string {
  const locale = new Intl.Locale(MARKETS[country].locale)
  return `${locale.language}-${country}`
}

/** The countries that have their own indexed page. */
export const INDEXED_COUNTRIES = MARKET_CODES.filter((code) => !CANONICAL_OF[code])

/** Every indexed page by hreflang, plus "x-default" → "/" for visitors from anywhere else. */
export function languageAlternates(absolute = false): Record<string, string> {
  const url = (country: CountryCode) => (absolute ? pageUrl(country) : pagePath(country))
  return {
    ...Object.fromEntries(INDEXED_COUNTRIES.map((code) => [hreflang(code), url(code)])),
    "x-default": absolute ? SITE.url : "/",
  }
}
