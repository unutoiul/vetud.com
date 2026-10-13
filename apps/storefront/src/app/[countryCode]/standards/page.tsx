import { CheckIcon, DocumentIcon as DescriptionOutlinedIcon, PackageIcon as Inventory2OutlinedIcon, SupportIcon as SupportAgentOutlinedIcon, SlidersIcon as TuneOutlinedIcon } from "@/components/brand/Icon"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import FaqAccordion, { type FaqItem } from "@/components/standards/FaqAccordion"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import Manifesto from "@/components/home/Manifesto"
import StandardsAccordion from "@/components/home/StandardsAccordion"

export const metadata: Metadata = {
  title: "Our standards",
  description: "How Vetud documents, describes, packs and supports every research material it sells.",
}

const PRINCIPLES = [
  {
    icon: DescriptionOutlinedIcon,
    title: "Traceability",
    text: "Each vial maps to a lot, and each lot to a batch record you can look up by number.",
  },
  {
    icon: TuneOutlinedIcon,
    title: "Transparency",
    text: "Specifications are stated plainly: form, purity target, storage. No claims about effects.",
  },
  {
    icon: Inventory2OutlinedIcon,
    title: "Careful handling",
    text: "Sealed vials, desiccant, protective kit boxes and tracked shipping in every region we serve.",
  },
  {
    icon: SupportAgentOutlinedIcon,
    title: "Real support",
    text: "Questions about lots, storage or orders go to people who can answer them.",
  },
]

const LISTING_CHECKLIST = [
  "Product code and category",
  "Physical form and purity target",
  "Storage conditions",
  "Every amount available, priced for your region",
  "Live stock status",
  "Documented lots with batch date and purity",
  "Certificate of analysis on request",
  "Clear research-use-only labelling",
]

const FAQ: FaqItem[] = [
  {
    question: "Who are your products for?",
    answer:
      "Our catalog is intended for qualified researchers and laboratories. All products are sold for in-vitro laboratory research only. They are not for human or veterinary use, and we do not provide dosing or usage guidance.",
  },
  {
    question: "How do I pay?",
    answer:
      "Checkout places your order and reserves the stock. You then receive an email with bank transfer details and your order number as the payment reference. We ship as soon as the payment arrives.",
  },
  {
    question: "When will my order ship?",
    answer:
      "Paid orders ship within 1–2 business days. Standard delivery takes 3–5 business days and express 1–2 business days. You receive a tracking link by email when the parcel ships.",
  },
  {
    question: "How do I get a certificate of analysis?",
    answer:
      "Look up your lot number on the documentation page. Where a COA file is published you can download it directly; otherwise use the request link and we send it by email.",
  },
  {
    question: "How should materials be stored?",
    answer:
      "Storage conditions are listed on every product page. Most lyophilized materials should be kept at -20 °C, desiccated and protected from light.",
  },
  {
    question: "Can I return an order?",
    answer:
      "Sealed, unopened items can be returned within 14 days of delivery. For quality concerns, contact us with your order and lot number. See shipping & returns for details.",
  },
]

export default function StandardsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our standards"
        title="Precision is a practice."
        description="Clear information is part of the material. These are the commitments behind every product we list."
      />

      <Section tone="white">
        <Grid container spacing={2}>
          {PRINCIPLES.map(({ icon: Icon, title, text }, index) => (
            <Grid key={title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper variant="outlined" sx={{ p: { xs: 3, md: 3.5 }, height: "100%", bgcolor: "#f7f9fa", borderRadius: 3 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 3 }}>
                  <Box sx={{ width: 48, height: 48, bgcolor: "#fff", border: "1px solid", borderColor: "divider", borderRadius: 2.5, display: "grid", placeItems: "center", color: "secondary.main" }}>
                    <Icon fontSize="small" />
                  </Box>
                  <Typography variant="mono" sx={{ color: "text.secondary" }}>
                    {String(index + 1).padStart(2, "0")}
                  </Typography>
                </Stack>
                <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                  {title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Section>

      <Section tone="wash">
        <Grid container spacing={{ xs: 5, md: 10 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <SectionHeading eyebrow="How we work" title="From batch to bench." />
            <Typography sx={{ color: "text.secondary", mb: 3 }}>Every product page lists:</Typography>
            <Stack component="ul" spacing={1.25} sx={{ listStyle: "none", p: 0, m: 0 }}>
              {LISTING_CHECKLIST.map((item) => (
                <Stack component="li" key={item} direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                  <CheckIcon fontSize="small" sx={{ color: "secondary.main" }} />
                  <Typography>{item}</Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <StandardsAccordion />
          </Grid>
        </Grid>
      </Section>

      <Section tone="white">
        <Grid container spacing={{ xs: 4, md: 10 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <SectionHeading eyebrow="FAQ" title="Good questions." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <FaqAccordion items={FAQ} />
          </Grid>
        </Grid>
      </Section>

      <Manifesto />
    </>
  )
}
