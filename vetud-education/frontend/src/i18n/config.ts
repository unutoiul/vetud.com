import type { Language } from "./languages"

/** The language's menu and form text, and the locale for dates and numbers. */
export async function getLanguageMessages(language: Language) {
  const messages = (await import(`./messages/${language}.json`)).default as typeof import("./messages/en.json")
  return { locale: language as string, messages, timeZone: "UTC" }
}
