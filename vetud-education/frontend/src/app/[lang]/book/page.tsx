import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import type { Metadata } from "next"
import { Suspense } from "react"
import BookBuyBox from "@/components/book/BookBuyBox"
import BookLanding from "@/components/book/BookLanding"
import { BOOK } from "@/components/book/book"
import { localizeMetadata } from "@/i18n/metadata"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
    title: BOOK.title,
    description: "32 peptides explained in detail, in plain language. A PDF book for $4.99.",
    robots: { index: false, follow: false },
    openGraph: {
      title: BOOK.title,
      images: [{ url: BOOK.cover, width: BOOK.width, height: BOOK.height, alt: BOOK.title }],
    },
    twitter: { card: "summary_large_image", title: BOOK.title, images: [{ url: BOOK.cover, alt: BOOK.title }] },
  })
}

/**
 * The book's page. The link in the first email lands here (?t=…), and the pay box opens Stripe.
 * Only the pay box reads the address, so it alone waits behind Suspense.
 */
export default function BookPage() {
  return (
    <BookLanding
      buyBox={
        <Suspense fallback={<Skeleton variant="rounded" height={188} sx={{ mt: 2.5, borderRadius: "8px" }} />}>
          <Box data-clarity-mask="True">
            <BookBuyBox />
          </Box>
        </Suspense>
      }
    />
  )
}
