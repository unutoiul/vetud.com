import type { MetadataRoute } from "next"
import { cacheLife } from "next/cache"
import { LEGAL_DOCUMENTS } from "@/content/legal"
import { BASE_URL } from "@/lib/config"
import { listProductHandles } from "@/lib/medusa/products"
import { listCountryCodes } from "@/lib/medusa/regions"

const STATIC_PATHS = ["", "/shop", "/tracking", "/education", "/standards", "/documentation", "/contact"]

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
      url: `${BASE_URL}/${country}${path}`,
      changeFrequency: path.startsWith("/products") ? ("daily" as const) : ("weekly" as const),
      priority: path === "" ? 1 : path.startsWith("/products") ? 0.8 : 0.5,
    }))
  )
}
