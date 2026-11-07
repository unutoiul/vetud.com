import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import type { Metadata } from "next"
import CartView from "@/components/cart/CartView"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Cart",
  robots: { index: false },
})
}

export default function CartPage() {
  const ct = useContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Your cart")} title={ct("Review your selection.")} description={ct("Your research materials, quantities and regional pricing in one place.")} />
      <Section tone="white" tight>
        <CartView />
      </Section>
    </>
  )
}
