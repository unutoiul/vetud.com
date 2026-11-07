import type { Metadata } from "next"
import { articleLanguages, articleUrl } from "@/lib/article-seo"
import { getPageLocalization } from "@/i18n/metadata"

export async function communityMetadata({ title, description, path, index = true, type = "website" }: {
  title: string; description: string; path: string; index?: boolean; type?: "website" | "article"
}): Promise<Metadata> {
  const { country, ct, openGraphLocale } = await getPageLocalization()
  title = ct(title)
  description = ct(description)
  const url = articleUrl(path, country)
  return {
    title: { absolute: `${title} | VETUD Community` },
    description,
    alternates: { canonical: url, languages: articleLanguages(path) },
    openGraph: { type, siteName: "VETUD Peptides Community", locale: openGraphLocale, title, description, url },
    twitter: { card: "summary", title, description },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
  }
}
