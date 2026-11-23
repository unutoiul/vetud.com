import type { CountryCode } from "@/config/markets"
import Compare from "./Compare"
import ContactFloat from "./ContactFloat"
import { CountryProvider } from "./CountryProvider"
import Facility from "./Facility"
import Faq from "./Faq"
import Footer from "./Footer"
import Header from "./Header"
import Hero from "./Hero"
import HowToOrder from "./HowToOrder"
import { OrderProvider } from "./OrderProvider"
import Products from "./Products"
import PromoBar from "./PromoBar"
import Quality from "./Quality"
import WhyDualChamber from "./WhyDualChamber"

/** The whole one-page site, with every price in the given country's currency. */
export default function Storefront({ country }: { country: CountryCode }) {
  return (
    <CountryProvider country={country}>
      <OrderProvider>
        <PromoBar />
        <Header />
        <main>
          <Hero />
          <Products />
          <WhyDualChamber />
          <Compare />
          <HowToOrder />
          <Quality />
          <Facility />
          <Faq />
        </main>
        <Footer />
        <ContactFloat />
      </OrderProvider>
    </CountryProvider>
  )
}
