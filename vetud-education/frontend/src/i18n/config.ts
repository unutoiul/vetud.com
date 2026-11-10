import type { Language } from "./languages"

const messages = {
  en: () => import("./messages/en.json"),
  fr: () => import("./messages/fr.json"),
} satisfies Record<Language, unknown>

/** The language's menu and form text, and the locale for dates and numbers. */
export async function getLanguageMessages(language: Language) {
  return { locale: language as string, messages: (await messages[language]()).default, timeZone: "UTC" }
}
