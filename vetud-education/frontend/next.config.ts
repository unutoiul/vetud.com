import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"
import { oldAddressRedirects } from "./src/i18n/old-addresses"

const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/$/, "")

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Vercel needs nothing extra. For a VPS or Docker host, build with NEXT_OUTPUT=standalone.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  // Until launch every page, including the .vercel.app addresses, stays out of search engines.
  async headers() {
    if (process.env.INDEXING_ENABLED === "true") return []
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }]
  },
  async redirects() {
    return [
      // Temporary until the launch has settled, because browsers keep permanent redirects.
      ...oldAddressRedirects({
        shopUrl: (process.env.NEXT_PUBLIC_SHOP_URL || "").replace(/\/$/, ""),
        permanent: process.env.REDIRECTS_PERMANENT === "true",
      }),
      // The Medusa Admin lives on the backend under /app.
      { source: "/admin", destination: `${backendUrl}/app`, permanent: false },
      { source: "/admin/:path*", destination: `${backendUrl}/app`, permanent: false },
    ]
  },
  images: {
    // Locally, community photos come from the Medusa dev server, which Next blocks by default.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9100" },
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default createNextIntlPlugin()(nextConfig)
