import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import Icon from "@/components/brand/Icon"
import { AppLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import ExpertApplicationForm from "@/components/community/ExpertApplicationForm"
import { communityMetadata } from "@/lib/community/seo"

export async function generateMetadata(): Promise<Metadata> {
  return communityMetadata({
  path: "/community/apply",
  title: "Apply to Be a Verified Expert",
  description: "Share your background, research interests and credentials to apply as a verified expert in the VETUD research community.",
})
}

export default function ExpertApplicationPage() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return <>
    <PageHeader eyebrow={ct("Community")} title={ct("Bring your expertise to the conversation.")} description={ct("Help members understand peptide research. Tell us about your work and share a public credential we can check.")} />
    <Section tone="white" sx={{ py: { xs: 4, md: 7 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 300px" }, gap: { xs: 5, md: 7 }, alignItems: "start" }}>
        <Box sx={{ minWidth: 0 }}>
          <AppLink href="/community" sx={{ display: "inline-flex", alignItems: "center", gap: 1, minHeight: 44, mb: 2, fontSize: 14 }}><Icon name="arrowRight" sx={{ fontSize: 17, transform: "rotate(180deg)" }} /> {act("backCommunity")}</AppLink>
          <Typography component="h2" variant="h4" sx={{ mb: 1 }}>{act("expertApplication")}</Typography>
          <Typography sx={{ color: "text.secondary", mb: 4 }}>{ct("Fields marked * are required. Your application is sent privately to the Vetud team for review.")}</Typography>
          <ExpertApplicationForm />
        </Box>
        <Box component="aside" aria-label={ct("About expert verification")} sx={{ p: { xs: 3, md: 3.5 }, bgcolor: "brand.mintWash", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <Icon name="shield" sx={{ color: "brand.blue", fontSize: 32, mb: 2 }} />
          <Typography component="h2" sx={{ fontSize: 20, fontWeight: 650, mb: 1 }}>{ct("What verification means")}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.75 }}>{ct("A verified badge tells members that our team has checked your professional or research background. Applying does not automatically grant a badge.")}</Typography>
          <Typography component="h3" sx={{ fontSize: 16, fontWeight: 650, mt: 3, mb: 1 }}>{ct("Before you apply")}</Typography>
          <Box component="ul" sx={{ pl: 2.25, my: 0, color: "text.secondary", fontSize: 14, lineHeight: 1.75, "& li + li": { mt: 1 } }}>
            <li>{ct("Use a professional email if you have one.")}</li>
            <li>{ct("Link an institutional profile, professional register, ORCID record or published work.")}</li>
            <li>{ct("Share public links only. Please leave out identity documents and patient information.")}</li>
          </Box>
          <Typography component="h3" sx={{ fontSize: 16, fontWeight: 650, mt: 3, mb: 1 }}>{ct("After you apply")}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", lineHeight: 1.75 }}>{ct("Our team reviews your background and the link you provide. We’ll follow up by email if we need more information and to let you know the outcome.")}</Typography>
          <Box sx={{ borderTop: "1px solid", borderColor: "divider", mt: 3, pt: 3 }}>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>{ct("Experts follow the same community rules: cite sources, disclose relevant interests, and leave out doses and personal protocols.")}</Typography>
            <AppLink href="/community/guidelines" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14 }}>{act("communityGuidelines")}</AppLink>
          </Box>
        </Box>
      </Box>
    </Section>
  </>
}
