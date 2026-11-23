import type { MetadataRoute } from "next"
import { INDEXED_COUNTRIES, languageAlternates, pageUrl } from "@/lib/seo"

/**
 * /sitemap.xml, for Google Search Console and Bing Webmaster Tools: every country's page ("/" for
 * the US, /de, /fr, /gb…), each listing the others by language (hreflang). /us and /xk point at "/"
 * and /al, so they're left out (src/lib/seo.ts).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const languages = languageAlternates(true)
  return INDEXED_COUNTRIES.map((code) => ({
    url: pageUrl(code),
    lastModified,
    changeFrequency: "weekly",
    priority: code === "US" ? 1 : 0.8,
    alternates: { languages },
  }))
}
