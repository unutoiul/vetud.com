import type { Metadata } from "next"
import { MARKETS, type CountryCode } from "@/config/markets"
import { OFFER } from "@/config/site"
import { format } from "@/i18n/format"
import { loadMessages } from "@/i18n"
import { languageAlternates, pagePath, pageUrl } from "@/lib/seo"
import Compare from "./Compare"
import ContactFloat from "./ContactFloat"
import CookieConsent from "./CookieConsent"
import { CountryProvider } from "./CountryProvider"
import Facility from "./Facility"
import Faq from "./Faq"
import Footer from "./Footer"
import Header from "./Header"
import Hero from "./Hero"
import HowToOrder from "./HowToOrder"
import LangScope from "./LangScope"
import { MessagesProvider } from "./MessagesProvider"
import { OrderProvider } from "./OrderProvider"
import Products from "./Products"
import PromoBar from "./PromoBar"
import Quality from "./Quality"
import TrialChart from "./TrialChart"
import WhyDualChamber from "./WhyDualChamber"

/** The page title and description in the country's language (src/i18n/messages). */
export async function storefrontMetadata(country: CountryCode): Promise<Metadata> {
  const m = await loadMessages(country)
  const offer = { saleLabel: m.offer.saleLabel, percent: OFFER.salePercent }
  const title = format(m.meta.title, offer)
  const description = format(m.meta.description, offer)
  return {
    title,
    description,
    // Each country's page is indexed at its own address, linked to the others by language.
    alternates: { canonical: pagePath(country), languages: languageAlternates() },
    // Replaces the root layout's openGraph as a whole, so the picture is repeated here.
    openGraph: {
      title,
      description,
      url: pageUrl(country),
      locale: MARKETS[country].locale.replaceAll("-", "_"),
      type: "website",
      images: [{ url: "/images/retatrutide-closed.webp", width: 1400, height: 1050, alt: m.products.retatrutide.gallery[0].alt }],
    },
  }
}

/** The whole one-page site, with every price in the given country's currency and its text. */
export default async function Storefront({ country }: { country: CountryCode }) {
  const messages = await loadMessages(country)
  return (
    <CountryProvider country={country}>
      <LangScope>
      <MessagesProvider country={country} messages={messages}>
      <OrderProvider>
        <PromoBar />
        <Header />
        <main>
          <Hero />
          <Products />
          <TrialChart />
          <WhyDualChamber />
          <Compare />
          <HowToOrder />
          <Quality />
          <Facility />
          <Faq />
        </main>
        <Footer />
        <ContactFloat />
        <CookieConsent />
      </OrderProvider>
      </MessagesProvider>
      </LangScope>
    </CountryProvider>
  )
}
