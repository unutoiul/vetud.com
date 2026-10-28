import type { Metadata } from "next"
import { Suspense } from "react"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import TrackingForm from "@/components/tracking/TrackingForm"

export const metadata: Metadata = {
  title: "Tracking",
  description: "Follow your parcel using the tracking number from your shipping email.",
}

export default function TrackingPage() {
  return <>
    <PageHeader eyebrow="Tracking" title="Follow your parcel." description="Enter the tracking number from your shipping confirmation. Your order number and parcel tracking number are different." />
    <Section tone="white" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 9 } }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", mb: 5 }}>
        <Typography>Ordered with an account? Find all your orders and tracking numbers in one place.</Typography>
        <ButtonLink href="/account/orders" variant="outlined">View my orders</ButtonLink>
      </Stack>
      <Suspense fallback={<Skeleton variant="rounded" height={160} />}><TrackingForm /></Suspense>
    </Section>
  </>
}
