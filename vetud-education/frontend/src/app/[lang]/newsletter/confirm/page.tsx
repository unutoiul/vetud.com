import { localizeMetadata } from "@/i18n/metadata"
import { getContentTranslator } from "@/i18n/server-content"
import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import ConfirmForm from "@/components/newsletter/ConfirmForm"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    title: "Confirm your email",
    robots: { index: false, follow: false },
  })
}

export default async function ConfirmPage() {
  const ct = await getContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Email list")} title={ct("Confirm your email")} />
      <Section tone="white" tight>
        {/* The email and signed token come from the link in our email. */}
        <Suspense fallback={<Skeleton variant="rounded" height={160} sx={{ maxWidth: 560 }} />}>
          <ConfirmForm />
        </Suspense>
      </Section>
    </>
  )
}
