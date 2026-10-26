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
      <PageHeader eyebrow="Secure checkout" title="Complete your order." description="Confirm your saved details, choose delivery and select an available payment method." />
      <Section tone="white" tight>
        <CheckoutFlow />
      </Section>
    </>
  )
}
