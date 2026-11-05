import type { MetadataRoute } from "next"
import { cacheLife } from "next/cache"
import { LEGAL_DOCUMENTS } from "@/content/legal"
import { ARTICLES } from "@/content/learn/articles"
import { PEPTIDES } from "@/content/learn/peptides"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { BASE_URL } from "@/lib/config"
import { articleLanguages, articleUrl } from "@/lib/article-seo"
import { listForumThreadIds } from "@/lib/medusa/forum"
import { listProductHandles } from "@/lib/medusa/products"
import { listCountryCodes } from "@/lib/medusa/regions"
import { storefrontLanguages } from "@/lib/storefront-seo"

const STATIC_PATHS = ["", "/shop", "/dual-chamber-pen", "/tracking", "/standards", "/documentation", "/contact"]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache"
  cacheLife("hours")

  const countries = await listCountryCodes()
  let handles: string[] = []
  try {
    handles = await listProductHandles()
  } catch {
    handles = []
  }

  const paths = [
    ...STATIC_PATHS,
    ...LEGAL_DOCUMENTS.map((document) => `/legal/${document.slug}`),
    ...handles.map((handle) => `/products/${handle}`),
  ]

  const storefront = countries.flatMap((country) =>
    paths.map((path) => ({
      url: country === "us" && path === "" ? BASE_URL : `${BASE_URL}/${country}${path}`,
      changeFrequency: path.startsWith("/products") ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.startsWith("/products") ? 0.8 : 0.5,
      ...(path === "" ? { alternates: { languages: { ...storefrontLanguages(""), "en-US": BASE_URL, "x-default": BASE_URL } } }
        : path.startsWith("/products") || path === "/shop" ? { alternates: { languages: storefrontLanguages(path) } } : {}),
    }))
  )

  // English article bodies are shared across storefronts; list the same preferred
  // URLs used in their canonical tags, with reciprocal regional alternates.
  const editorial = [
    ...PEPTIDES.map(peptide => ({ path: `/learn/${peptide.slug}`, slug: peptide.slug })),
    ...ARTICLES.map(article => ({ path: `/news/${article.slug}`, slug: article.slug })),
  ].map(({ path, slug }) => {
    const image = getLearnIllustration(slug)
    return { url: articleUrl(path), changeFrequency: "monthly" as const, priority: 0.7,
      alternates: { languages: articleLanguages(path) }, ...(image ? { images: [`${BASE_URL}${image.src}`] } : {}),
    }
  })
  const collections = ["/learn", "/news", "/videos", "/community", "/community/guidelines", "/community/apply"].map(path => ({
    url: articleUrl(path), changeFrequency: "weekly" as const, priority: 0.8,
    alternates: { languages: articleLanguages(path) },
  }))
  // Community threads are English too, and share the same preferred URLs.
  let threads: string[] = []
  try {
    threads = await listForumThreadIds(500)
  } catch {
    threads = []
  }
  const community = threads.map(id => ({
    url: articleUrl(`/community/${id}`), changeFrequency: "weekly" as const, priority: 0.5,
    alternates: { languages: articleLanguages(`/community/${id}`) },
  }))
  return [...storefront, ...collections, ...editorial, ...community]
}
