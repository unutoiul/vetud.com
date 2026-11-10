import type { MetadataRoute } from "next"
import { cacheLife } from "next/cache"
import { LEGAL_DOCUMENTS } from "@/content/legal"
import { ARTICLES } from "@/content/learn/articles"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { PEPTIDES } from "@/content/learn/peptides"
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/i18n/languages"
import { articleLanguages, articleUrl } from "@/lib/article-seo"
import { BASE_URL } from "@/lib/config"
import { listForumThreadIds } from "@/lib/medusa/forum"

const COLLECTIONS = ["", "/learn", "/news", "/videos", "/community", "/community/guidelines", "/community/apply", "/contact"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache"
  cacheLife("hours")

  const everyLanguage = (path: string, entry: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">) =>
    LANGUAGES.map((language) => ({ url: articleUrl(path, language), alternates: { languages: articleLanguages(path) }, ...entry }))

  const collections = COLLECTIONS.flatMap((path) => everyLanguage(path, { changeFrequency: "weekly", priority: path ? 0.8 : 1 }))
  const legal = LEGAL_DOCUMENTS.flatMap((document) => everyLanguage(`/legal/${document.slug}`, { changeFrequency: "monthly", priority: 0.3 }))
  const editorial = [
    ...PEPTIDES.map((peptide) => ({ path: `/learn/${peptide.slug}`, slug: peptide.slug })),
    ...ARTICLES.map((article) => ({ path: `/news/${article.slug}`, slug: article.slug })),
  ].flatMap(({ path, slug }) => {
    const image = getLearnIllustration(slug)
    return everyLanguage(path, { changeFrequency: "monthly", priority: 0.7, ...(image ? { images: [`${BASE_URL}${image.src}`] } : {}) })
  })

  let threads: string[] = []
  try {
    threads = await listForumThreadIds(500)
  } catch {
    threads = []
  }
  // Member posts are written in one language, so each thread is listed once.
  const community = threads.map((id) => ({ url: articleUrl(`/community/${id}`, DEFAULT_LANGUAGE), changeFrequency: "weekly" as const, priority: 0.5 }))

  return [...collections, ...legal, ...editorial, ...community]
}
