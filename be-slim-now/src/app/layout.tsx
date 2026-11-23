import type { Metadata, Viewport } from "next"
import { DM_Mono, Jost, Manrope } from "next/font/google"
import { AntdRegistry } from "@ant-design/nextjs-registry"
import Providers from "@/components/Providers"
import { SITE } from "@/config/site"
import { colors } from "@/theme/tokens"

const display = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-display", display: "swap" })
const body = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-body", display: "swap" })
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Black Friday −40% · Tirzepatide & Retatrutide Pens · BeSlimNow",
  description: SITE.description,
  // The per-country pages (/de, /gb…) are the same page in another currency.
  alternates: { canonical: "/" },
  openGraph: {
    title: "Black Friday −40% · Tirzepatide & Retatrutide Pens · VETUD",
    description: SITE.description,
    images: [{ url: "/images/retatrutide-closed.webp", width: 1400, height: 1050, alt: "VETUD Retatrutide pen box" }],
    type: "website",
  },
  robots: { index: true, follow: true },
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
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  )
}
