import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import ResetPasswordForm from "@/components/account/ResetPasswordForm"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
}

export default async function ResetPasswordRoute() {
  const t = await getTranslations("Account")
  return (
    <>
      <PageHeader eyebrow="Account" title={t("resetTitle")} description={t("resetPageIntro")} />
      <Section tone="white" tight>
        {/* The token and email come from the emailed link's query string. */}
        <Suspense fallback={<Skeleton variant="rounded" height={320} sx={{ maxWidth: 560 }} />}>
          <ResetPasswordForm />
        </Suspense>
      </Section>
    </>
  )
}
