import type { MetadataRoute } from "next"
import { cacheLife } from "next/cache"
import { LEGAL_DOCUMENTS } from "@/content/legal"
import { BASE_URL } from "@/lib/config"
import { listProductSitemapEntries } from "@/lib/medusa/products"
import { listCountryCodes } from "@/lib/medusa/regions"
import { storefrontLanguages } from "@/lib/storefront-seo"

const STATIC_PATHS = ["", "/shop", "/dual-chamber-pen", "/tracking", "/standards", "/documentation", "/contact"]

/** A content date as a lastmod: "2026-11-02" is kept, "2 November 2026" becomes "2026-11-02". */
function isoDate(value: string | undefined) {
  if (!value) return undefined
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/**
 * The shop's pages on its own domain (BASE_URL, https://www.pep.company in production), one entry per
 * country with hreflang alternates. Learning pages, news, videos and the community are listed by the
 * education site's sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  "use cache"
  cacheLife("hours")

  const countries = await listCountryCodes()
  let products: { handle: string; updatedAt?: string }[] = []
  try {
    products = await listProductSitemapEntries()
  } catch {
    products = []
  }

  const pages: { path: string; lastModified?: string }[] = [
    ...STATIC_PATHS.map((path) => ({ path })),
    ...LEGAL_DOCUMENTS.map((document) => ({ path: `/legal/${document.slug}`, lastModified: isoDate(document.updated) })),
    ...products.map((product) => ({ path: `/products/${product.handle}`, lastModified: product.updatedAt })),
  ]

  return countries.flatMap((country) =>
    pages.map(({ path, lastModified }) => ({
      url: country === "us" && path === "" ? BASE_URL : `${BASE_URL}/${country}${path}`,
      ...(lastModified ? { lastModified } : {}),
      changeFrequency: path.startsWith("/products") ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.startsWith("/products") ? 0.8 : 0.5,
      ...(path === "" ? { alternates: { languages: { ...storefrontLanguages(""), "en-US": BASE_URL, "x-default": BASE_URL } } }
        : path.startsWith("/products") || path === "/shop" ? { alternates: { languages: storefrontLanguages(path) } } : {}),
    }))
  )
}
