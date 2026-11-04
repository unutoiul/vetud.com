import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { EXPLAINER_VIDEO, ExplainerVideo, FormatComparison } from "@/components/product/DualChamberExplainer"
import FaqAccordion, { type FaqItem } from "@/components/standards/FaqAccordion"
import { collectionMetadata } from "@/lib/article-seo"
import { BASE_URL } from "@/lib/config"
import { PEN_EXPLAINER_IMAGE } from "@/lib/product-images"

const TITLE = "The dual-chamber pen, explained"
const DESCRIPTION = "How the VETUD dual-chamber pen keeps freeze-dried peptide and bacteriostatic water apart in one cartridge, what the pen kit box adds, and how both compare with a vial."

export const metadata = collectionMetadata({ path: "/dual-chamber-pen", title: `${TITLE}: pen, pen kit box or vial`, description: DESCRIPTION })

const PARTS = [
  { name: "Cartridge holder", text: "The clear sleeve at the top of the pen. The cartridge sits inside it, so you can see both chambers." },
  { name: "Peptide chamber", text: "The front chamber holds the lyophilized (freeze-dried) peptide as a dry powder, which keeps it stable." },
  { name: "BAC-water chamber", text: "The rear chamber holds bacteriostatic water. A rubber stopper keeps it apart from the powder until the cartridge is used." },
  { name: "Pen body", text: "The metal body below the holder. It comes with both the dual-chamber pen and the pen kit box; the kit box adds 12 disposable needles and an instruction booklet." },
]

const FAQ: FaqItem[] = [
  { question: "Is bacteriostatic water included?", answer: "With the dual-chamber pen and the pen kit box, yes: it's already in the cartridge's second chamber. With a vial, no: bacteriostatic water is sold separately, in 10 ml and 30 ml vials." },
  { question: "What's the difference between the three?", answer: "The amount of peptide is the same. The dual-chamber pen is the pen body with its two-chamber cartridge. The pen kit box adds 12 disposable needles and an instruction booklet, packed in the VETUD box, and costs a little more. The vial is the freeze-dried powder on its own, at the lowest price." },
  { question: "Which products come in all three formats?", answer: "Every peptide. Each product page lets you choose the dual-chamber pen, the pen kit box or the vial, and shows the price of each amount. Bacteriostatic water comes as a cartridge or a vial." },
  { question: "Is the pen for personal use?", answer: "No. Like everything we sell, the pen and the vial are supplied for laboratory research use only, not for human or veterinary use. This page describes the packaging; it isn't a guide to using it." },
]

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "How the VETUD dual-chamber pen works",
  description: DESCRIPTION,
  thumbnailUrl: [`${BASE_URL}${EXPLAINER_VIDEO.poster}`],
  contentUrl: `${BASE_URL}${EXPLAINER_VIDEO.src}`,
  uploadDate: "2026-11-04",
  duration: EXPLAINER_VIDEO.duration,
}

export default function DualChamberPenPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd).replace(/</g, "\\u003c") }} />
      <PageHeader eyebrow="Formats" title={TITLE} description="Every VETUD peptide comes as a dual-chamber pen, a pen kit box or a vial. Here's what the pen is, what each one includes, and how to choose.">
        <ButtonLink href="/shop" variant="contained" size="large">Shop pens and vials</ButtonLink>
      </PageHeader>

      <Section tone="white" tight aria-labelledby="video-title">
        <Box sx={{ maxWidth: 1040, mx: "auto" }}>
          <Typography id="video-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em", mb: 2.5 }}>Watch: how it works in 40 seconds</Typography>
          <ExplainerVideo />
        </Box>
      </Section>

      <Section tone="paper" tight aria-labelledby="parts-title">
        <Box sx={{ maxWidth: 1040, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: { xs: 4, md: 7 }, alignItems: "center" }}>
          <Box sx={{ position: "relative", aspectRatio: "1 / 1", borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "#eef4fb" }}>
            <Image src={PEN_EXPLAINER_IMAGE} alt="The dual-chamber cartridge on its own and inside the pen, labelled: cartridge holder, lyophilized peptide, BAC water and pen body" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "contain" }} />
          </Box>
          <Box>
            <Typography id="parts-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em" }}>How it&apos;s built</Typography>
            <Box component="dl" sx={{ mt: 2.5, mb: 0, display: "grid", gap: 2.25 }}>
              {PARTS.map((part, index) => (
                <Box key={part.name} sx={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 1.5 }}>
                  <Box aria-hidden sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "brand.navy", color: "#fff", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700 }}>{index + 1}</Box>
                  <Box>
                    <Typography component="dt" sx={{ fontWeight: 650, fontSize: 17, color: "brand.ink" }}>{part.name}</Typography>
                    <Typography component="dd" sx={{ m: 0, mt: 0.25, fontSize: 15, lineHeight: 1.7, color: "text.secondary" }}>{part.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Section>

      <Section tone="white" tight aria-labelledby="compare-title">
        <Box sx={{ maxWidth: 840, mx: "auto" }}>
          <Typography id="compare-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em" }}>Pen, pen kit box or vial: which to choose</Typography>
          <Typography sx={{ mt: 1.5, mb: 3, fontSize: 16, lineHeight: 1.75, color: "text.secondary" }}>
            Same peptide, same amounts. Choose the pen kit box if you want everything, needles included, in one box. Choose the dual-chamber pen for the pen and cartridge on their own. Choose the vial if you already have bacteriostatic water and your own supplies; it&apos;s the lowest price.
          </Typography>
          <FormatComparison />
        </Box>
      </Section>

      <Section tone="paper" tight aria-labelledby="faq-title">
        <Box sx={{ maxWidth: 840, mx: "auto" }}>
          <Typography id="faq-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em", mb: 2.5 }}>Questions</Typography>
          <FaqAccordion items={FAQ} />
          <ButtonLink href="/shop" variant="contained" size="large" sx={{ mt: 4 }}>Shop all products</ButtonLink>
        </Box>
      </Section>
    </>
  )
}
