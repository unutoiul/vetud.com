import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import BookOffer from "@/components/book/BookOffer"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { localizeMetadata } from "@/i18n/metadata"
import { getContentTranslator } from "@/i18n/server-content"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    title: "Peptides Explained: the book",
    description: "32 peptides explained in detail, in plain language. A PDF book for $4.99.",
    robots: { index: false, follow: false },
  })
}

/** The book's page: the link in the first email lands here, and the visitor pays with Stripe. */
export default async function BookPage() {
  const ct = await getContentTranslator()
  return (
    <>
      <PageHeader eyebrow={ct("Book")} title={ct("Get your copy")} />
      <Section tone="white" tight data-clarity-mask="True">
        {/* The ?t= token from the email link carries the visitor's address. */}
        <Suspense fallback={<Skeleton variant="rounded" height={480} sx={{ maxWidth: 880 }} />}>
          <BookOffer />
        </Suspense>
      </Section>
    </>
  )
}
