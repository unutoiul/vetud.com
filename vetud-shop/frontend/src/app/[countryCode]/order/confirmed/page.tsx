import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import OrderConfirmation from "@/components/checkout/OrderConfirmation"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Order confirmed",
  robots: { index: false },
})
}

export default function OrderConfirmedPage() {
  const ct = useContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Thank you")} title={ct("Your order is in.")} />
      <Section tone="white" tight>
        <Suspense fallback={<Skeleton variant="rounded" height={360} />}>
          <OrderConfirmation />
        </Suspense>
      </Section>
    </>
  )
}
