import type { Metadata } from "next"
import { articleLanguages, articleUrl } from "@/lib/article-seo"
import { getPageLocalization } from "@/i18n/metadata"
import { DEFAULT_LANGUAGE } from "@/i18n/languages"
import { SHARE_IMAGE } from "@/lib/config"

export async function communityMetadata({ title, description, path, index = true, type = "website", memberContent = false }: {
  title: string; description: string; path: string; index?: boolean; type?: "website" | "article"; memberContent?: boolean
}): Promise<Metadata> {
  const { language, ct, openGraphLocale } = await getPageLocalization()
  if (!memberContent) {
    title = ct(title)
    description = ct(description)
  }
  // Members write in their own language, so their pages are listed once, at the default address.
  const translatedCopy = memberContent && language !== DEFAULT_LANGUAGE
  const url = articleUrl(path, translatedCopy ? DEFAULT_LANGUAGE : language)
  return {
    title: { absolute: ct.template("{v0} | VETUD Community", { v0: title }, { translateValues: false }) },
    description,
    alternates: { canonical: url, ...(memberContent ? {} : { languages: articleLanguages(path) }) },
    openGraph: { type, siteName: ct("VETUD Peptides Community"), locale: openGraphLocale, title, description, url, images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE.url] },
    robots: index && !translatedCopy ? { index: true, follow: true } : { index: false, follow: true },
  }
}
