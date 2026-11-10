import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// Cache Components uses a static shell, so it cannot use a per-request script nonce.
// Limit checkout resources while allowing Next's inline bootstrap and MUI styles.
const backendOrigin = new URL(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").origin
const checkoutCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://maps.googleapis.com https://maps.gstatic.com https://*.nmi.com https://*.paypal.com https://*.paypalobjects.com`,
  `connect-src 'self' ${backendOrigin} https://*.googleapis.com https://*.gstatic.com https://*.nmi.com https://*.paypal.com https://*.paypalobjects.com${process.env.NODE_ENV === "development" ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "frame-src 'self' https://*.nmi.com https://*.paypal.com https://*.paypalobjects.com",
  `img-src 'self' data: blob: https: ${backendOrigin}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ")

// Once the sites are split, learning pages move to the education site. Temporary until it has settled.
const educationUrl = (process.env.NEXT_PUBLIC_EDUCATION_URL || "").replace(/\/$/, "")
const educationRedirects = process.env.NEXT_PUBLIC_EDUCATION_CUTOVER === "true" && educationUrl ? [
  { source: "/:country(fr|lu)/:section(learn|news|videos|community)/:path*", destination: `${educationUrl}/fr/:section/:path*`, permanent: false },
  { source: "/:country([a-z]{2})/:section(learn|news|videos|community)/:path*", destination: `${educationUrl}/en/:section/:path*`, permanent: false },
  { source: "/:section(learn|news|community)/:path*", destination: `${educationUrl}/en/:section/:path*`, permanent: false },
  // /videos/<file> is this site's own product video, so only the page itself moves.
  { source: "/videos", destination: `${educationUrl}/en/videos`, permanent: false },
] : []

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Vercel needs nothing extra. For a VPS or Docker host, build with NEXT_OUTPUT=standalone.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:countryCode/checkout", headers: [{ key: "Content-Security-Policy", value: checkoutCsp }] }]
  },
  // The Medusa Admin lives on the backend under /app. This makes vetud.com/admin a shortcut to it.
  async redirects() {
    const adminUrl = `${(process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")}/app`
    return [
      ...educationRedirects,
      { source: "/:countryCode/legal/shipping-returns", destination: "/:countryCode/legal/shipping", permanent: true },
      { source: "/legal/shipping-returns", destination: "/legal/shipping", permanent: true },
      { source: "/:countryCode/discover", destination: "/:countryCode/shop", permanent: true },
      // The old single Learn page grew into the learning hub.
      { source: "/:countryCode/education", destination: "/:countryCode/learn", permanent: true },
      { source: "/education", destination: "/learn", permanent: true },
      { source: "/discover", destination: "/shop", permanent: true },
      // The unspecified Melanotan kit was replaced by Melanotan I and II (2026-11-04).
      { source: "/:countryCode/products/melanotan", destination: "/:countryCode/shop?category=beauty", permanent: false },
      { source: "/admin", destination: adminUrl, permanent: false },
      { source: "/admin/:path*", destination: adminUrl, permanent: false },
    ]
  },
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

export default createNextIntlPlugin()(nextConfig)
