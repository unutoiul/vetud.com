import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import CommunityDisclaimer from "@/components/community/CommunityDisclaimer"
import Composer from "@/components/community/Composer"
import { GUIDELINE_SUMMARY } from "@/lib/community/format"
import { communityMetadata } from "@/lib/community/seo"

export const metadata = communityMetadata({
  path: "/community/new",
  title: "Start a thread",
  description: "Post a research log, a question or a discussion in the Vetud community.",
  index: false,
})

export default function NewThreadPage() {
  return <Section tone="white" sx={{ py: { xs: 4, md: 6 } }}>
    <Box sx={{ maxWidth: 1180, mx: "auto" }}>
      <Box component="nav" aria-label="Breadcrumb" sx={{ fontSize: 14, mb: 2 }}><AppLink href="/community">← Community</AppLink></Box>
      <Typography component="h1" sx={{ fontSize: { xs: 32, md: 44 }, fontWeight: 500, letterSpacing: "-.035em", color: "brand.navy" }}>Start a thread</Typography>
      <Box sx={{ mt: { xs: 3, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" }, gap: { xs: 4, lg: 6 }, alignItems: "start" }}>
        <Box sx={{ minWidth: 0 }}>
          {/* The composer reads ?kind=, ?peptide= and ?lot= to start pre-filled. */}
          <Suspense fallback={<Skeleton variant="rounded" height={480} />}><Composer /></Suspense>
        </Box>
        <Box component="aside" aria-label="Before you post" sx={{ p: 2.5, bgcolor: "brand.mintWash", borderRadius: "10px", position: { lg: "sticky" }, top: { lg: 112 } }}>
          <Typography component="h2" sx={{ fontSize: 16, fontWeight: 700, color: "brand.navy" }}>Before you post</Typography>
          <Box component="ul" sx={{ m: 0, mt: 1.5, pl: 2.25, display: "grid", gap: 1, fontSize: 14, lineHeight: 1.6, color: "brand.navySoft" }}>
            {GUIDELINE_SUMMARY.map(line => <li key={line}>{line}</li>)}
          </Box>
          <Typography component="h2" sx={{ mt: 2.5, fontSize: 16, fontWeight: 700, color: "brand.navy" }}>A useful research log</Typography>
          <Box component="ul" sx={{ m: 0, mt: 1.5, pl: 2.25, display: "grid", gap: 1, fontSize: 14, lineHeight: 1.6, color: "brand.navySoft" }}>
            <li>Measure the same way each time (same scale, same time of day).</li>
            <li>Note anything else that changed: diet, training, sleep, other medicines.</li>
            <li>Add a check-in every few weeks, even when nothing changes.</li>
          </Box>
          <AppLink href="/community/guidelines" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, mt: 1, fontSize: 14, fontWeight: 600 }}>Full guidelines</AppLink>
        </Box>
      </Box>
      <CommunityDisclaimer sx={{ mt: 6, pt: 3, borderTop: "1px solid", borderColor: "divider" }} />
    </Box>
  </Section>
}
