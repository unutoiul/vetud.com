import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import BookThankYou from "@/components/book/BookThankYou"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { localizeMetadata } from "@/i18n/metadata"
import { getContentTranslator } from "@/i18n/server-content"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    title: "Thank you for your order",
    robots: { index: false, follow: false },
  })
}

/** Where Stripe Checkout sends a book buyer after paying. */
export default async function BookThankYouPage() {
  const ct = await getContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Your order")} title={ct("Thank you for your order")} />
      <Section tone="white" tight data-clarity-mask="True">
        {/* The Stripe session id in the address identifies the payment. */}
        <Suspense fallback={<Skeleton variant="rounded" height={360} sx={{ maxWidth: 880 }} />}>
          <BookThankYou />
        </Suspense>
      </Section>
    </>
  )
}
