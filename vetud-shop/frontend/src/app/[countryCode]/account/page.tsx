import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import type { Metadata } from "next"
import AccountPage from "@/components/account/AccountPage"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Your account",
  description: "Manage your Vetud profile, saved delivery addresses, order history and shipment tracking.",
  robots: { index: false },
})
}

export default function AccountRoute() {
  const ct = useContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Account")} title={ct("A simpler way to order.")} description={ct("Save your details once, then manage addresses, orders and tracking in one place.")} />
      <Section tone="white" tight>
        <AccountPage />
      </Section>
    </>
  )
}
