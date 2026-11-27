import { localizeMetadata } from "@/i18n/metadata"
import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import type { Metadata, Viewport } from "next"
import { lang } from "next/root-params"
import { Suspense } from "react"
import AccountProvider from "@/components/account/AccountProvider"
import ClarityAnalytics from "@/components/common/ClarityAnalytics"
import { LanguageProvider } from "@/components/common/language"
import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import WelcomeExperience from "@/components/welcome/WelcomeExperience"
import { asLanguage, LANGUAGES } from "@/i18n/languages"
import { getClientI18n } from "@/i18n/server-config"
import { BASE_URL, SITE } from "@/lib/config"
import { preloadFonts } from "@/theme/fonts"
import ThemeRegistry from "@/theme/ThemeRegistry"
import { NextIntlClientProvider } from "next-intl"
import { brand } from "@/theme/tokens"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    metadataBase: new URL(BASE_URL),
    title: {
      default: `${SITE.name}: a clearer perspective on peptide science`,
      template: `%s · ${SITE.name}`,
    },
    description: SITE.description,
    openGraph: { siteName: SITE.name, type: "website" },
    // Meta Business > Brand safety > Domains, "meta tag" method: paste only the content="…" value.
    ...(process.env.FACEBOOK_DOMAIN_VERIFICATION ? { verification: { other: { "facebook-domain-verification": process.env.FACEBOOK_DOMAIN_VERIFICATION } } } : {}),
  })
}

export const viewport: Viewport = {
  themeColor: brand.slate25,
}

export function generateStaticParams() {
  return LANGUAGES.map((language) => ({ lang: language }))
}

export default async function LanguageLayout({ children }: LayoutProps<"/[lang]">) {
  const act = await getTranslations("Actions")
  const language = asLanguage(await lang())
  const i18n = await getClientI18n(language)

  return (
    <html lang={i18n.locale}>
      <head>
        {/* The fonts are declared through MUI (theme/fonts.ts); fetch the first ones before the styles ask. */}
        {preloadFonts.map((href) => <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />)}
      </head>
      <body>
        <NextIntlClientProvider {...i18n}>
          <ThemeRegistry>
            <LanguageProvider language={language}>
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
                    color: brand.white,
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                    "&:focus": { top: 8 },
                  }}
                >
                  {act("skipContent")}
                </Box>
                <Header />
                <Box component="main" id="main" sx={{ minHeight: "60vh" }}>
                  {children}
                </Box>
                <Footer />
                <ClarityAnalytics language={language} />
                <Suspense fallback={null}>
                  <WelcomeExperience />
                </Suspense>
              </AccountProvider>
            </LanguageProvider>
          </ThemeRegistry>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
