import type { MetadataRoute } from "next"
import { cacheLife } from "next/cache"
import { LEGAL_DOCUMENTS } from "@/content/legal"
import { BASE_URL } from "@/lib/config"
import { listProductHandles } from "@/lib/medusa/products"
import { listCountryCodes } from "@/lib/medusa/regions"
import { storefrontLanguages } from "@/lib/storefront-seo"

const STATIC_PATHS = ["", "/shop", "/dual-chamber-pen", "/tracking", "/standards", "/documentation", "/contact"]

/** The shop's pages. Learning pages, news, videos and the community are listed by the education site. */
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

  return countries.flatMap((country) =>
    paths.map((path) => ({
      url: country === "us" && path === "" ? BASE_URL : `${BASE_URL}/${country}${path}`,
      changeFrequency: path.startsWith("/products") ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.startsWith("/products") ? 0.8 : 0.5,
      ...(path === "" ? { alternates: { languages: { ...storefrontLanguages(""), "en-US": BASE_URL, "x-default": BASE_URL } } }
        : path.startsWith("/products") || path === "/shop" ? { alternates: { languages: storefrontLanguages(path) } } : {}),
    }))
  )
}
