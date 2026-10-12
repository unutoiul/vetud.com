import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Vercel needs nothing extra. For a VPS or Docker host, build with NEXT_OUTPUT=standalone.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  images: {
    // Locally, product photos come from the Medusa dev server on localhost, which Next blocks by
    // default (SSRF protection). Allowed in development only; production keeps the protection.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    // Product photos uploaded to Medusa (served by the Medusa server under /static).
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
