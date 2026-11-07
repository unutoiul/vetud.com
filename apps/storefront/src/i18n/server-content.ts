import "server-only"
import { getLocale, getMessages } from "next-intl/server"
import { createContentTranslator, type ContentDictionary, type ContentTemplates } from "./content"

export async function getContentTranslator() {
  const [messages, locale] = await Promise.all([getMessages(), getLocale()])
  const content = messages as unknown as { Content?: ContentDictionary; ContentTemplates?: ContentTemplates }
  return createContentTranslator(content.Content, locale, content.ContentTemplates)
}
