import { localizeMetadata } from "@/i18n/metadata"
import { getContentTranslator } from "@/i18n/server-content"
import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import UnsubscribeForm from "@/components/newsletter/UnsubscribeForm"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Unsubscribe",
  robots: { index: false, follow: false },
})
}

export default async function UnsubscribePage() {
  const ct = await getContentTranslator()
  const t = await getTranslations("Offer")
  return (
    <>
      <PageHeader eyebrow={ct("Account")} title={t("unsubscribeTitle")} />
      <Section tone="white" tight>
        {/* The email and signed token come from the link in our email. */}
        <Suspense fallback={<Skeleton variant="rounded" height={160} sx={{ maxWidth: 560 }} />}>
          <UnsubscribeForm />
        </Suspense>
      </Section>
    </>
  )
}
