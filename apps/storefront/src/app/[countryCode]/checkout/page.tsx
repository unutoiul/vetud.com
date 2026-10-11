import type { Metadata } from "next"
import CheckoutFlow from "@/components/checkout/CheckoutFlow"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
}

export default function CheckoutPage() {
  return (
    <>
      <PageHeader eyebrow="Secure checkout" title="Almost there." />
      <Section tone="white" tight>
        <CheckoutFlow />
      </Section>
    </>
  )
}
