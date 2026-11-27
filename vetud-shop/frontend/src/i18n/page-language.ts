import { getCountryRules, messageLocale } from "./config"
import translatedLanguages from "./content/languages.json"

const TRANSLATED = new Set<string>(translatedLanguages)

/**
 * The language a country's pages are actually written in, for <html lang>, hreflang and structured
 * data. A country whose language has no page-text translation yet (src/i18n/content/<lang>.json,
 * listed in content/languages.json by `npm run check:i18n`) shows English text with translated
 * menus, so it's tagged as English for that country ("en-DE"), not as German. Dates, numbers and
 * menus still use the country's own locale.
 */
export function pageLocale(country: string): string {
  const locale = getCountryRules(country).locale
  if (locale.startsWith("en") || TRANSLATED.has(messageLocale(locale))) return locale
  return `en-${country.toUpperCase()}`
}
