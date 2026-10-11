import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import OrderConfirmation from "@/components/checkout/OrderConfirmation"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
}

export default function OrderConfirmedPage() {
  return (
    <>
      <PageHeader eyebrow="Thank you" title="Your order is in." />
      <Section tone="white" tight>
        <Suspense fallback={<Skeleton variant="rounded" height={360} />}>
          <OrderConfirmation />
        </Suspense>
      </Section>
    </>
  )
}
