import "server-only"
import { getLanguageMessages } from "./config"
import type { ContentDictionary, ContentTemplates } from "./content"
import clientKeys from "./content/client-keys.json"
import type { Language } from "./languages"

type ContentFile = { translations: ContentDictionary; templates: ContentTemplates }

const ENGLISH: ContentFile = { translations: {}, templates: {} }

/** Page text is translated in files kept in this project, so it never depends on a backend call. */
const content: Record<Language, () => Promise<ContentFile>> = {
  en: async () => ENGLISH,
  fr: () => import("./content/fr.json").then((file) => file.default as ContentFile),
}

export async function getLanguageI18n(language: Language) {
  const base = await getLanguageMessages(language)
  const { translations, templates } = await content[language]()
  return { ...base, messages: { ...base.messages, Content: translations, ContentTemplates: templates } }
}

const CLIENT_KEYS = new Set<string>(clientKeys)
const clientOnly = <T,>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([key]) => CLIENT_KEYS.has(key)))

/** What the browser receives: the menus and the text client components show, not whole guides. */
export async function getClientI18n(language: Language) {
  const full = await getLanguageI18n(language)
  return { ...full, messages: { ...full.messages, Content: clientOnly(full.messages.Content), ContentTemplates: clientOnly(full.messages.ContentTemplates) } }
}
