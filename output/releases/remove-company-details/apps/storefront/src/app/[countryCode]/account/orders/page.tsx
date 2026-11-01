import type { Metadata } from "next"
import AccountPage from "@/components/account/AccountPage"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export const metadata: Metadata = {
  title: "Your orders & tracking",
  description: "View your Vetud order history, delivery details and shipment tracking.",
  robots: { index: false, follow: false },
}

export default function OrdersRoute() {
  return <>
    <PageHeader eyebrow="Your account" title="Every order. Every shipment." description="Your order details and delivery updates, together in one place." />
    <Section tone="white" tight><AccountPage view="orders" /></Section>
  </>
}
