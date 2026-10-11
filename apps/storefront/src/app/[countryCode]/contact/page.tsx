import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined"
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined"
import MailOutlineIcon from "@mui/icons-material/MailOutlined"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { Suspense } from "react"
import ContactForm from "@/components/contact/ContactForm"
import { AppLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { SerifAccent } from "@/components/common/SectionHeading"
import { SITE } from "@/lib/config"

export const metadata: Metadata = {
  title: "Contact",
  description: "Questions about a product, a lot or an order? Write to the Vetud team.",
}

export default function ContactPage() {
  const details = [
    { icon: MailOutlineIcon, title: "Email", body: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> },
    { icon: AccessTimeOutlinedIcon, title: "Response time", body: "Within one business day, Monday to Friday." },
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
        title={
          <>
            People behind <SerifAccent>the science.</SerifAccent>
          </>
        }
        description="Questions about a product, a lot or an order reach a real person. Include your order or lot number for the fastest answer."
      />
      <Section tone="white">
        <Grid container spacing={{ xs: 5, md: 8 }}>
          <Grid size={{ xs: 12, md: 7.5 }}>
            <Suspense fallback={<Skeleton variant="rounded" height={420} />}>
              <ContactForm />
            </Suspense>
          </Grid>
          <Grid size={{ xs: 12, md: 4.5 }}>
            <Stack spacing={2}>
              {details.map(({ icon: Icon, title, body }) => (
                <Paper key={title} variant="outlined" sx={{ p: 2.5, display: "flex", gap: 2, bgcolor: "#fbfcfa" }}>
                  <Icon sx={{ color: "secondary.main", mt: "2px" }} />
                  <div>
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
