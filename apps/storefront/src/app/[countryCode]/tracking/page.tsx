import { localizeMetadata } from "@/i18n/metadata"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import type { Metadata } from "next"
import { Suspense } from "react"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import TrackingForm from "@/components/tracking/TrackingForm"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Tracking",
  description: "Follow your parcel using the tracking number from your shipping email.",
})
}

export default function TrackingPage() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return <>
    <PageHeader eyebrow={ct("Tracking")} title={ct("Follow your parcel.")} description={ct("Enter the tracking number from your shipping confirmation. Your order number and parcel tracking number are different.")} />
    <Section tone="white" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 9 } }}>
      <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center", mb: 5 }}>
        <Typography>{ct("Ordered with an account? Find all your orders and tracking numbers in one place.")}</Typography>
        <ButtonLink href="/account/orders" variant="outlined">{act("viewOrders")}</ButtonLink>
      </Stack>
      <Suspense fallback={<Skeleton variant="rounded" height={160} />}><TrackingForm /></Suspense>
    </Section>
  </>
}
