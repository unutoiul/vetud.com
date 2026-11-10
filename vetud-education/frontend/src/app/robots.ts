import type { MetadataRoute } from "next"
import { BASE_URL } from "@/lib/config"

export default function robots(): MetadataRoute.Robots {
  if (process.env.INDEXING_ENABLED !== "true") return { rules: [{ userAgent: "*", disallow: "/" }] }
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${BASE_URL}/sitemap.xml` }
}
