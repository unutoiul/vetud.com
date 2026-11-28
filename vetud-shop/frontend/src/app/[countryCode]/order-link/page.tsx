import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import CircularProgress from "@mui/material/CircularProgress"
import Stack from "@mui/material/Stack"
import type { Metadata } from "next"
import { Suspense } from "react"
import OrderLinkLoader from "@/components/checkout/OrderLinkLoader"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    title: "Your order",
    robots: { index: false },
  })
}

/** /<country>/order-link?cart=<id>: opens an order the shop prepared for this customer (see OrderLinkLoader). */
export default function OrderLinkPage() {
  const ct = useContentTranslator()
  return (
    <>
      <PageHeader
        eyebrow={ct("Your order")}
        title={ct("Your order is ready.")}
        description={ct(
          "We've added the items we agreed. Add your details and choose how to pay to finish your order.",
        )}
      />
      <Section tone="white" tight data-clarity-mask="True">
        <Suspense
          fallback={
            <Stack sx={{ alignItems: "center", py: 6 }}>
              <CircularProgress size={32} />
            </Stack>
          }
        >
          <OrderLinkLoader />
        </Suspense>
      </Section>
    </>
  )
}
