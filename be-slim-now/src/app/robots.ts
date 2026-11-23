import type { MetadataRoute } from "next"
import { SITE } from "@/config/site"

/** /robots.txt: everything but the order API may be crawled, and the sitemap is listed for every crawler. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
