import Box from "@mui/material/Box"
import type { Metadata, Viewport } from "next"
import { DM_Mono, Manrope } from "next/font/google"
import { countryCode } from "next/root-params"
import CartDrawer from "@/components/cart/CartDrawer"
import AccountProvider from "@/components/account/AccountProvider"
import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import StoreProvider from "@/components/store/StoreProvider"
import { BASE_URL, SITE } from "@/lib/config"
import {
  getRegionForCountry,
  listCountryCodes,
  listCountryOptions,
  listRegions,
} from "@/lib/medusa/regions"
import ThemeRegistry from "@/theme/ThemeRegistry"
import { NextIntlClientProvider } from "next-intl"
import { getCountryI18n } from "@/i18n/config"

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" })
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${SITE.name}: a clearer perspective on peptide science`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: { siteName: SITE.name, type: "website" },
}

export const viewport: Viewport = {
  themeColor: "#f7f9fa",
}

export async function generateStaticParams() {
  const codes = await listCountryCodes()
  return codes.map((code) => ({ countryCode: code }))
}

export default async function CountryLayout({ children }: LayoutProps<"/[countryCode]">) {
  const code = await countryCode()
  const i18n = await getCountryI18n(code)
  const region = (await getRegionForCountry(code)) ?? (await listRegions())[0]
  if (!region) {
    throw new Error("No regions found. Is the Medusa backend running and seeded?")
  }
  const countries = await listCountryOptions()

  return (
    <html lang={i18n.locale} className={`${manrope.variable} ${dmMono.variable}`}>
      <body>
        <NextIntlClientProvider {...i18n}>
        <ThemeRegistry>
          <StoreProvider
            countryCode={code}
            region={{
              id: region.id,
              name: region.name,
              currencyCode: region.currency_code,
              freeShippingThreshold:
                typeof region.metadata?.free_shipping_threshold === "number"
                  ? region.metadata.free_shipping_threshold
                  : undefined,
            }}
            countries={countries}
          >
            <AccountProvider>
              <Box
                component="a"
                href="#main"
                sx={{
                  position: "absolute",
                  left: 8,
                  top: -48,
                  zIndex: 2000,
                  bgcolor: "brand.navy",
                  color: "#fff",
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  "&:focus": { top: 8 },
                }}
              >
                Skip to content
              </Box>
              <Header />
              <Box component="main" id="main" sx={{ minHeight: "60vh" }}>
                {children}
              </Box>
              <Footer />
              <CartDrawer />
            </AccountProvider>
          </StoreProvider>
        </ThemeRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
