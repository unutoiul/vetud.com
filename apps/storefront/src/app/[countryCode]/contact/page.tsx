import { localizeMetadata } from "@/i18n/metadata"
import { getContentTranslator } from "@/i18n/server-content"
import { ClockIcon as AccessTimeOutlinedIcon, DocumentIcon as DescriptionOutlinedIcon, MailIcon as MailOutlineIcon } from "@/components/brand/Icon"
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

export async function generateMetadata(): Promise<Metadata> {
  return localizeMetadata({
  title: "Contact",
  description: "Questions about a product, a lot or an order? Write to the Vetud team.",
})
}

export default async function ContactPage() {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const t = await getTranslations("Pages")
  const details = [
    { icon: MailOutlineIcon, title: "Email", body: <a href={`mailto:${SITE.email}`}>{ct(SITE.email)}</a> },
    { icon: AccessTimeOutlinedIcon, title: t("response"), body: t("responseText") },
    {
      icon: DescriptionOutlinedIcon,
      title: "Looking for a COA?",
      body: (
        <>
          {ct("Try the")} <AppLink href="/documentation">{act("lotLookup")}</AppLink> {ct("first. Most records are available instantly.")}
        </>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        eyebrow={ct("Contact")}
        title={ct("People behind the science.")}
        description={ct("Questions about a product, a lot or an order reach a real person. Include your order or lot number for the fastest answer.")}
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
