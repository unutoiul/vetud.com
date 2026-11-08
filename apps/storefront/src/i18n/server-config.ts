import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import { sdk } from "@/lib/medusa/sdk"
import { getCountryI18n as getBaseCountryI18n, messageLocale } from "./config"
import type { ContentDictionary, ContentTemplates } from "./content"

async function getReviewedContent(locale: string): Promise<{ translations: ContentDictionary; templates: ContentTemplates }> {
  "use cache"
  cacheLife("minutes")
  cacheTag("localized-content", `localized-content:${locale}`)
  try {
    const bundle = await sdk.client.fetch<{ locale: string; source_hash: string; translations: ContentDictionary; templates?: ContentTemplates }>("/store/localized-content", { query: { locale } })
    if (bundle.locale !== locale || !/^[a-f0-9]{64}$/.test(bundle.source_hash)) throw new Error("Invalid content bundle")
    return { translations: bundle.translations, templates: bundle.templates ?? {} }
  } catch {
    // A missing locale or temporary outage must not take checkout offline.
    return { translations: {}, templates: {} }
  }
}

export async function getCountryI18n(country: string) {
  const base = await getBaseCountryI18n(country)
  const content = await getReviewedContent(messageLocale(base.locale))
  return { ...base, messages: { ...base.messages, Content: content.translations, ContentTemplates: content.templates } }
}
