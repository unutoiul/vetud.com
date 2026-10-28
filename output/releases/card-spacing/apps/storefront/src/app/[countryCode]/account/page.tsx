import type { Metadata } from "next"
import AccountPage from "@/components/account/AccountPage"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your Vetud profile, saved delivery addresses, order history and shipment tracking.",
  robots: { index: false },
}

export default function AccountRoute() {
  return (
    <>
      <PageHeader eyebrow="Account" title="A simpler way to order." description="Save your details once, then manage addresses, orders and tracking in one place." />
      <Section tone="white" tight>
        <AccountPage />
      </Section>
    </>
  )
}
