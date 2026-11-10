import { localizeMetadata } from "@/i18n/metadata"
import { getContentTranslator } from "@/i18n/server-content"
import { ClockIcon as AccessTimeOutlinedIcon, MailIcon as MailOutlineIcon } from "@/components/brand/Icon"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import ContactForm from "@/components/contact/ContactForm"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { SITE } from "@/lib/config"

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Contact",
  description: "Questions about a guide or the community? Write to the VETUD team.",
})
}

export default async function ContactPage() {
  const ct = await getContentTranslator()
  const t = await getTranslations("Pages")
  const details = [
    { icon: MailOutlineIcon, title: "Email", body: <a href={`mailto:${SITE.email}`}>{ct(SITE.email)}</a> },
    { icon: AccessTimeOutlinedIcon, title: t("response"), body: t("responseText") },
  ]

  return (
    <>
      <PageHeader
        eyebrow={ct("Contact")}
        title={ct("People behind the science.")}
        description={ct("Questions about a guide, a study or the community reach a real person.")}
      />
      <Section tone="white">
        <Grid container spacing={{ xs: 5, md: 8 }}>
          <Grid size={{ xs: 12, md: 7.5 }}>
            <Typography variant="h4" component="h2" sx={{ mb: 1 }}>{t("write")}</Typography>
            <Typography sx={{ color: "text.secondary", mb: 3 }}>{ct("Tell us which guide or thread you mean so we can help you quickly.")}</Typography>
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
                    <Typography sx={{ fontWeight: 700 }}>{ct(title)}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      {ct(body)}
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
