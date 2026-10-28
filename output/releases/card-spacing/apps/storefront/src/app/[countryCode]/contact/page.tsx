import { ClockIcon as AccessTimeOutlinedIcon, DocumentIcon as DescriptionOutlinedIcon, GlobeIcon as PlaceOutlinedIcon, MailIcon as MailOutlineIcon } from "@/components/brand/Icon"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import ContactForm from "@/components/contact/ContactForm"
import { AppLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { SITE } from "@/lib/config"

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about a product, a lot or an order? Write to the Vetud team.",
}

export default async function ContactPage() {
  const t = await getTranslations("Pages")
  const details = [
    { icon: MailOutlineIcon, title: "Email", body: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> },
    { icon: PlaceOutlinedIcon, title: t("registered"), body: `${SITE.legalName}, ${SITE.address}` },
    { icon: AccessTimeOutlinedIcon, title: t("response"), body: t("responseText") },
    {
      icon: DescriptionOutlinedIcon,
      title: "Looking for a COA?",
      body: (
        <>
          Try the <AppLink href="/documentation">lot lookup</AppLink> first. Most records are available instantly.
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title="People behind the science."
        description="Questions about a product, a lot or an order reach a real person. Include your order or lot number for the fastest answer."
      />
      <Section tone="white">
        <Grid container spacing={{ xs: 5, md: 8 }}>
          <Grid size={{ xs: 12, md: 7.5 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 1 }}>{t("write")}</Typography>
            <Typography sx={{ color: "text.secondary", mb: 3 }}>{t("writeHelp")}</Typography>
            <Suspense fallback={<Skeleton variant="rounded" height={420} />}>
              <ContactForm />
            </Suspense>
          </Grid>
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Stack spacing={2}>
              {details.map(({ icon: Icon, title, body }) => (
                <Paper key={title} variant="outlined" sx={{ p: 3, display: "flex", gap: 2, bgcolor: "#f7f9fa", borderRadius: 3 }}>
                  <Icon sx={{ color: "secondary.main", mt: "2px", flexShrink: 0 }} />
                  <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      {body}
                    </Typography>
                  </div>
                </Paper>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Section>
    </>
  )
}
