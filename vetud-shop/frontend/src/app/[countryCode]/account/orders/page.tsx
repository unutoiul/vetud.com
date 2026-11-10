import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import type { Metadata } from "next"
import AccountPage from "@/components/account/AccountPage"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Your orders & tracking",
  description: "View your Vetud order history, delivery details and shipment tracking.",
  robots: { index: false, follow: false },
})
}

export default function OrdersRoute() {
  const ct = useContentTranslator()
  return <>
    <PageHeader eyebrow={ct("Your account")} title={ct("Every order. Every shipment.")} description={ct("Your order details and delivery updates, together in one place.")} />
    <Section tone="white" tight><AccountPage view="orders" /></Section>
  </>
}
