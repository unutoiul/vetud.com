import { useLocale, useMessages } from "next-intl"
import { createContentTranslator, type ContentDictionary, type ContentTemplates } from "./content"

/** Works in client and synchronous server components through next-intl's conditional export. */
export function useContentTranslator() {
  const messages = useMessages() as unknown as { Content?: ContentDictionary; ContentTemplates?: ContentTemplates }
  return createContentTranslator(messages.Content, useLocale(), messages.ContentTemplates)
}
