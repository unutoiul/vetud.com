import type { Metadata } from "next"
import { articleLanguages, articleUrl } from "@/lib/article-seo"

/**
 * Community pages are English everywhere, like the learning pages, so regional copies share one
 * preferred URL (see article-seo.ts).
 */
export function communityMetadata({ title, description, path, index = true, type = "website" }: {
  title: string; description: string; path: string; index?: boolean; type?: "website" | "article"
}): Metadata {
  const url = articleUrl(path)
  return {
    title: { absolute: `${title} | VETUD Community` },
    description,
    alternates: { canonical: url, languages: articleLanguages(path) },
    openGraph: { type, siteName: "VETUD Peptides Community", locale: "en_US", title, description, url },
    twitter: { card: "summary", title, description },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
  }
}
