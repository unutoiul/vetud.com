/** Languages with prepared text: each has menu messages, page content and a name below. */
export const PREPARED_LANGUAGES = ["en", "fr"] as const
export type Language = (typeof PREPARED_LANGUAGES)[number]

/**
 * The languages the site is published in. Add one only when its pages are fully translated and a
 * person has checked them. A prepared language left out here redirects to the same page in English.
 * French is prepared and waits for that check.
 */
export const LANGUAGES: readonly Language[] = ["en"]

export const DEFAULT_LANGUAGE: Language = "en"
export const LANGUAGE_COOKIE = "vetud_language"
export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", fr: "Français" }

export const isLanguage = (value: string | undefined): value is Language => LANGUAGES.includes(value as Language)
export const asLanguage = (value: string | undefined): Language => (isLanguage(value) ? value : DEFAULT_LANGUAGE)
