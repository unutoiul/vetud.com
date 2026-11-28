/**
 * Languages with prepared text: each has menu messages (src/i18n/messages), page content
 * (src/i18n/content) and a name below. `npm run translate` fills in what a prepared language is missing.
 */
export const PREPARED_LANGUAGES = ["en", "es", "pt", "fr", "de", "it", "nl", "pl"] as const
export type Language = (typeof PREPARED_LANGUAGES)[number]

/**
 * The languages the site is published in. Add one only when `npm run check:i18n` says all of its text
 * is translated (the build fails otherwise). A prepared language left out here redirects to the same
 * page in English.
 */
export const LANGUAGES: readonly Language[] = ["en"]

export const DEFAULT_LANGUAGE: Language = "en"
export const LANGUAGE_COOKIE = "vetud_language"
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
}

export const isLanguage = (value: string | undefined): value is Language => LANGUAGES.includes(value as Language)
export const asLanguage = (value: string | undefined): Language => (isLanguage(value) ? value : DEFAULT_LANGUAGE)
