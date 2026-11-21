import "server-only"
import { getCountryI18n as getBaseCountryI18n, messageLocale } from "./config"
import type { ContentDictionary, ContentTemplates } from "./content"
import clientKeys from "./content/client-keys.json"

type ContentFile = { translations: ContentDictionary; templates: ContentTemplates }

const NO_CONTENT: ContentFile = { translations: {}, templates: {} }

/**
 * Page text (research, legal pages, product text) is translated in files kept in this project
 * (`npm run translate`), so it never depends on a backend call. A language without a file, and
 * English, show the original text.
 */
async function getContent(locale: string): Promise<ContentFile> {
  if (locale.startsWith("en")) return NO_CONTENT
  try {
    return (await import(`./content/${locale}.json`)).default as ContentFile
  } catch {
    return NO_CONTENT
  }
}

export async function getCountryI18n(country: string) {
  const base = await getBaseCountryI18n(country)
  const content = await getContent(messageLocale(base.locale))
  return { ...base, messages: { ...base.messages, Content: content.translations, ContentTemplates: content.templates } }
}

const CLIENT_KEYS = new Set<string>(clientKeys)
const clientOnly = <T,>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).filter(([key]) => CLIENT_KEYS.has(key)))

/** What the browser receives: menus and the text client components show, not whole guides or legal pages. */
export async function getClientI18n(country: string) {
  const full = await getCountryI18n(country)
  return { ...full, messages: { ...full.messages, Content: clientOnly(full.messages.Content), ContentTemplates: clientOnly(full.messages.ContentTemplates) } }
}
