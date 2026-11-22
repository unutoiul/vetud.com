import Compare from "@/components/Compare"
import ContactFloat from "@/components/ContactFloat"
import Faq from "@/components/Faq"
import Footer from "@/components/Footer"
import Header from "@/components/Header"
import Hero from "@/components/Hero"
import HowToOrder from "@/components/HowToOrder"
import Products from "@/components/Products"
import PromoBar from "@/components/PromoBar"
import Quality from "@/components/Quality"
import WhyDualChamber from "@/components/WhyDualChamber"

export default function Home() {
  return (
    <>
      <PromoBar />
      <Header />
      <main>
        <Hero />
        <Products />
        <WhyDualChamber />
        <Compare />
        <HowToOrder />
        <Quality />
        <Faq />
      </main>
      <Footer />
      <ContactFloat />
    </>
  )
}
