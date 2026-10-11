import type { Metadata } from "next"
import CartView from "@/components/cart/CartView"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false },
}

export default function CartPage() {
  return (
    <>
      <PageHeader eyebrow="Your cart" title="Review your selection." />
      <Section tone="white" tight>
        <CartView />
      </Section>
    </>
  )
}
