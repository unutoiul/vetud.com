import type { Metadata } from "next"
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
    <Section tone="white" sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 6, md: 9 } }}><TrackingForm /></Section>
  </>
}
