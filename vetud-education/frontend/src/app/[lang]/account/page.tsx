import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import type { Metadata } from "next"
import AccountPage from "@/components/account/AccountPage"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    title: "Your account",
    description: "Sign in to take part in the VETUD community.",
    robots: { index: false },
  })
}

export default function AccountRoute() {
  const ct = useContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Account")} title={ct("Your VETUD account.")} description={ct("Sign in to ask questions, answer other members and comment on articles.")} />
      <Section tone="white" tight>
        <AccountPage />
      </Section>
    </>
  )
}
