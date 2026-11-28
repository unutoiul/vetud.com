import type { Metadata, Viewport } from "next"
import { DM_Mono, Jost, Manrope } from "next/font/google"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import Analytics from "@/components/Analytics"
import Providers from "@/components/Providers"
import { OFFER, SITE } from "@/config/site"
import { colors } from "@/theme/tokens"

const display = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-display",
  display: "swap",
})
const body = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
})
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${OFFER.saleLabel} −${OFFER.salePercent}% · Tirzepatide & Retatrutide Pens · BeSlimNow`,
  description: SITE.description,
  // Canonical and hreflang links are set per country page (storefrontMetadata, src/lib/seo.ts).
  openGraph: {
    title: `${OFFER.saleLabel} −${OFFER.salePercent}% · Tirzepatide & Retatrutide Pens · VETUD`,
    description: SITE.description,
    images: [{ url: "/images/retatrutide-closed.webp", width: 1400, height: 1050, alt: "VETUD Retatrutide pen box" }],
    type: "website",
  },
  robots: { index: true, follow: true },
  // Ownership checks for Google Search Console and Bing Webmaster Tools ("HTML tag" method): paste
  // only the content="…" value into these env vars. Not needed when the site is verified another way.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
}

/**
 * Tells search engines the site's name and who runs it (shown as the site name above results).
 * Products aren't marked up: Google doesn't allow rich results or Shopping listings for these pens.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: "BeSlimNow",
      alternateName: "beslimnow.com",
      publisher: { "@id": `${SITE.url}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: "BeSlimNow",
      url: SITE.url,
      email: SITE.email,
      logo: { "@type": "ImageObject", url: `${SITE.url}/brand/icon-512.png`, width: 512, height: 512 },
    },
  ],
}

export const viewport: Viewport = {
  themeColor: colors.navy,
  colorScheme: "light",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      style={{ scrollBehavior: "smooth", scrollPaddingTop: 80, background: colors.paper, overflowX: "clip" }}
    >
      <body
        style={{
          margin: 0,
          background: colors.paper,
          color: colors.navyInk,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          overflowX: "clip",
        }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
        <Analytics />
      </body>
    </html>
  )
}
