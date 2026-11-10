/**
 * The languages the site is published in. Add one only when its pages are fully translated and a
 * person has checked them. To hold French back, remove "fr" here and /fr redirects to /en.
 */
export const LANGUAGES = ["en", "fr"] as const
export type Language = (typeof LANGUAGES)[number]

export const DEFAULT_LANGUAGE: Language = "en"
export const LANGUAGE_COOKIE = "vetud_language"
export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", fr: "Français" }

export const isLanguage = (value: string | undefined): value is Language => LANGUAGES.includes(value as Language)
export const asLanguage = (value: string | undefined): Language => (isLanguage(value) ? value : DEFAULT_LANGUAGE)
