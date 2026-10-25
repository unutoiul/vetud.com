import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import PayPalReturn from "@/components/checkout/PayPalReturn"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export const metadata: Metadata = {
  title: "Confirming payment",
  robots: { index: false },
}

export default function PayPalReturnPage() {
  return (
    <>
      <PageHeader eyebrow="Payment" title="Confirming your payment." />
      <Section tone="white" tight>
        <Suspense fallback={<Skeleton variant="rounded" height={200} />}>
          <PayPalReturn />
        </Suspense>
      </Section>
    </>
  )
}
