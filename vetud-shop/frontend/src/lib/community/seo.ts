import type { Metadata } from "next"
import { articleLanguages, articleUrl } from "@/lib/article-seo"
import { getPageLocalization } from "@/i18n/metadata"

export async function communityMetadata({ title, description, path, index = true, type = "website", memberContent = false }: {
  title: string; description: string; path: string; index?: boolean; type?: "website" | "article"; memberContent?: boolean
}): Promise<Metadata> {
  const { country, ct, openGraphLocale } = await getPageLocalization()
  if (!memberContent) {
    title = ct(title)
    description = ct(description)
  }
  const url = articleUrl(path, country)
  return {
    title: { absolute: ct.template("{v0} | VETUD Community", { v0: title }, { translateValues: false }) },
    description,
    alternates: { canonical: url, languages: articleLanguages(path) },
    openGraph: { type, siteName: ct("VETUD Peptides Community"), locale: openGraphLocale, title, description, url },
    twitter: { card: "summary", title, description },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
  }
}
