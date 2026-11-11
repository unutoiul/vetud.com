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

/** A content date as a lastmod: "2026-11-02" and "2026-10" are kept, "11 November 2026" becomes "2026-11-11". */
function isoDate(value: string | undefined) {
  if (!value) return undefined
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/**
 * Every education page on www.vetud.com in each launched language, with hreflang alternates.
 * News articles and legal pages carry their dates as lastmod.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache"
  cacheLife("hours")

  const everyLanguage = (path: string, entry: Omit<MetadataRoute.Sitemap[number], "url" | "alternates">) =>
    LANGUAGES.map((language) => ({ url: articleUrl(path, language), alternates: { languages: articleLanguages(path) }, ...entry }))
  const dated = (value: string | undefined) => {
    const lastModified = isoDate(value)
    return lastModified ? { lastModified } : {}
  }

  const collections = COLLECTIONS.flatMap((path) => everyLanguage(path, { changeFrequency: "weekly", priority: path ? 0.8 : 1 }))
  const legal = LEGAL_DOCUMENTS.flatMap((document) => everyLanguage(`/legal/${document.slug}`, { changeFrequency: "monthly", priority: 0.3, ...dated(document.updated) }))
  const editorial = [
    ...PEPTIDES.map((peptide) => ({ path: `/learn/${peptide.slug}`, slug: peptide.slug, date: undefined })),
    ...ARTICLES.map((article) => ({ path: `/news/${article.slug}`, slug: article.slug, date: article.date })),
  ].flatMap(({ path, slug, date }) => {
    const image = getLearnIllustration(slug)
    return everyLanguage(path, { changeFrequency: "monthly", priority: 0.7, ...dated(date), ...(image ? { images: [`${BASE_URL}${image.src}`] } : {}) })
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
