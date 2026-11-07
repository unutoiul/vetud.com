import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import PayPalReturn from "@/components/checkout/PayPalReturn"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Confirming payment",
  robots: { index: false },
})
}

export default function PayPalReturnPage() {
  const ct = useContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Payment")} title={ct("Confirming your payment.")} />
      <Section tone="white" tight>
        <Suspense fallback={<Skeleton variant="rounded" height={200} />}>
          <PayPalReturn />
        </Suspense>
      </Section>
    </>
  )
}
