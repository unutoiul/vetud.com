import { localizeMetadata } from "@/i18n/metadata"
import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import type { Metadata, Viewport } from "next"
import { DM_Mono, Manrope } from "next/font/google"
import { lang } from "next/root-params"
import { Suspense } from "react"
import AccountProvider from "@/components/account/AccountProvider"
import { LanguageProvider } from "@/components/common/language"
import Footer from "@/components/layout/Footer"
import Header from "@/components/layout/Header"
import WelcomeExperience from "@/components/welcome/WelcomeExperience"
import { asLanguage, LANGUAGES } from "@/i18n/languages"
import { getClientI18n } from "@/i18n/server-config"
import { BASE_URL, SITE } from "@/lib/config"
import ThemeRegistry from "@/theme/ThemeRegistry"
import { NextIntlClientProvider } from "next-intl"

const manrope = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-manrope", display: "swap" })
const dmMono = DM_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    metadataBase: new URL(BASE_URL),
    title: {
      default: `${SITE.name}: a clearer perspective on peptide science`,
      template: `%s · ${SITE.name}`,
    },
    description: SITE.description,
    openGraph: { siteName: SITE.name, type: "website" },
  })
}

export const viewport: Viewport = {
  themeColor: "#f7f9fa",
}

export function generateStaticParams() {
  return LANGUAGES.map((language) => ({ lang: language }))
}

export default async function LanguageLayout({ children }: LayoutProps<"/[lang]">) {
  const act = await getTranslations("Actions")
  const language = asLanguage(await lang())
  const i18n = await getClientI18n(language)

  return (
    <html lang={i18n.locale} className={`${manrope.variable} ${dmMono.variable}`}>
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
                    color: "#fff",
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
