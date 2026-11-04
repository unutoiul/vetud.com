import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { EXPLAINER_VIDEO, ExplainerVideo, FormatComparison } from "@/components/product/DualChamberExplainer"
import FaqAccordion, { type FaqItem } from "@/components/standards/FaqAccordion"
import { collectionMetadata } from "@/lib/article-seo"
import { BASE_URL } from "@/lib/config"
import { PEN_EXPLAINER_IMAGE, REUSABLE_PEN_IMAGE } from "@/lib/product-images"

const TITLE = "The dual-chamber pen, explained"
const DESCRIPTION = "How the reusable VETUD dual-chamber pen works: freeze-dried peptide and bacteriostatic water kept apart in one cartridge, the pen kit box, refill dual-chamber vials, and how they compare with a vial."

export const metadata = collectionMetadata({ path: "/dual-chamber-pen", title: `${TITLE}: pen kit box, dual-chamber vial or vial`, description: DESCRIPTION })

const PARTS = [
  { name: "Cartridge holder", text: "The clear sleeve at the top of the pen. The cartridge sits inside it, so you can see both chambers." },
  { name: "Peptide chamber", text: "The front chamber holds the lyophilized (freeze-dried) peptide as a dry powder, which keeps it stable." },
  { name: "BAC-water chamber", text: "The rear chamber holds bacteriostatic water. A rubber stopper keeps it apart from the powder until the cartridge is used." },
  { name: "Pen body", text: "The reusable metal body below the holder. It comes in the pen kit box, with 12 disposable needles and an instruction booklet." },
]

/** The reusable pen, part by part, as labelled in the artwork. */
const REUSABLE = [
  { name: "A pen body that stays", text: "The metal body is made to last. The drive, the rear dial and the indicator window stay with the pen; only the cartridge inside is changed." },
  { name: "Transparent, graduated holder", text: "The clear holder supports the cartridge and connects it to the pen body. Its printed scale leaves both chambers visible, so you can see the powder, the liquid and how much is left." },
  { name: "Two chambers in each cartridge", text: "The freeze-dried peptide sits in the front chamber and the diluent (bacteriostatic water) in the rear chamber, kept apart by a rubber stopper. They don't touch until the cartridge is used." },
  { name: "Mixed inside the cartridge", text: "When the cartridge is used, the moving stopper reaches a small bypass channel in the glass. The liquid flows around it into the front chamber and the powder dissolves there, so there's no separate mixing vial." },
  { name: "Replace the cartridge when it's empty", text: "Take out the empty cartridge and fit a new dual-chamber vial, sold on its own. Nothing else changes." },
  { name: "Why reusable", text: "You buy the pen once, in the pen kit box. After that, refills cost less than a new kit, and there's less to throw away." },
]

/** What the video shows, in order (it has on-screen text). */
const CHAPTERS = [
  "The reusable pen: one pen body with a replaceable cartridge for the powder and the liquid",
  "Inside the transparent holder: how the cartridge fits the pen body",
  "Separation: the stopper keeps the freeze-dried peptide and the diluent apart",
  "Bypass and transfer: a channel opens around the stopper and the liquid moves forward",
  "Reconstitution: the liquid reaches the dry powder inside the cartridge",
  "Keep the pen, replace the cartridge when it's empty",
]

const FAQ: FaqItem[] = [
  { question: "Is bacteriostatic water included?", answer: "With a dual-chamber vial or the pen kit box, yes: it's already in the cartridge's second chamber. With a vial, no: add bacteriostatic water (10 ml or 30 ml) and U-100 syringes from the product page." },
  { question: "What's the difference between the three?", answer: "The amount of peptide is the same. The pen kit box has the reusable pen with one dual-chamber vial, 12 disposable needles and an instruction booklet, in the VETUD box. A dual-chamber vial is the two-chamber cartridge on its own, to refill the pen. A vial is the freeze-dried powder on its own, at the lowest price." },
  { question: "Is the pen reusable?", answer: "Yes. Buy the pen kit box once, keep the pen body, and replace the cartridge with a new dual-chamber vial when it's empty." },
  { question: "Which products come in all three formats?", answer: "Every peptide. Each product page lets you choose a dual-chamber vial, a vial or the pen kit box, and shows the price of each amount. Bacteriostatic water comes as a cartridge or a vial." },
  { question: "Is the pen for personal use?", answer: "No. Like everything we sell, the pen and the vial are supplied for laboratory research use only, not for human or veterinary use. This page describes the packaging; it isn't a guide to using it." },
]

const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  name: "The reusable VETUD dual-chamber pen",
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
      <PageHeader eyebrow="Formats" title={TITLE} description="Every VETUD peptide comes as a dual-chamber vial, a vial or a pen kit box with the reusable pen. Here's how the pen works, what each one includes, and how to choose.">
        <ButtonLink href="/shop" variant="contained" size="large">Shop pens and vials</ButtonLink>
      </PageHeader>

      <Section tone="white" tight aria-labelledby="video-title">
        <Box sx={{ maxWidth: 1040, mx: "auto" }}>
          <Typography id="video-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em", mb: 2.5 }}>Watch: the reusable pen in {EXPLAINER_VIDEO.length}</Typography>
          <ExplainerVideo />
          <Typography component="h3" sx={{ mt: 3.5, mb: 1.25, fontSize: 15, fontWeight: 650 }}>What the video shows</Typography>
          <Box component="ol" sx={{ m: 0, pl: 2.5, display: "grid", gap: 0.75, "& li": { fontSize: 15, lineHeight: 1.7, color: "text.secondary" } }}>
            {CHAPTERS.map((chapter) => <li key={chapter}>{chapter}</li>)}
          </Box>
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

      <Section tone="white" tight aria-labelledby="reusable-title">
        <Box sx={{ maxWidth: 1040, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: { xs: 4, md: 7 }, alignItems: "center" }}>
          <Box sx={{ order: { md: 2 }, position: "relative", aspectRatio: "1 / 1", borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "#eef4fb" }}>
            <Image src={REUSABLE_PEN_IMAGE} alt="The reusable VETUD dual-chamber pen, labelled: graduated holder, freeze-dried peptide, diluent and reusable pen body" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "contain" }} />
          </Box>
          <Box>
            <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue" }}>Reusable</Typography>
            <Typography id="reusable-title" component="h2" sx={{ mt: 1, fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em" }}>One pen body, many cartridges</Typography>
            <Typography sx={{ mt: 1.5, fontSize: 16, lineHeight: 1.75, color: "text.secondary" }}>
              The VETUD dual-chamber pen is reusable. It comes in the pen kit box; keep the pen body and replace the cartridge with a new dual-chamber vial when it&apos;s empty.
            </Typography>
            <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 3, p: 0, display: "grid", gap: 2.25 }}>
              {REUSABLE.map((point) => (
                <Box component="li" key={point.name} sx={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 1.5 }}>
                  <Icon name="checkCircle" sx={{ fontSize: 22, color: "brand.blue", mt: 0.25 }} />
                  <Box>
                    <Typography component="h3" sx={{ fontWeight: 650, fontSize: 17, color: "brand.ink" }}>{point.name}</Typography>
                    <Typography sx={{ mt: 0.25, fontSize: 15, lineHeight: 1.7, color: "text.secondary" }}>{point.text}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Section>

      <Section tone="paper" tight aria-labelledby="compare-title">
        <Box sx={{ maxWidth: 840, mx: "auto" }}>
          <Typography id="compare-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em" }}>Dual-chamber vial, vial or pen kit box: which to choose</Typography>
          <Typography sx={{ mt: 1.5, mb: 3, fontSize: 16, lineHeight: 1.75, color: "text.secondary" }}>
            Same peptide, same amounts. New to the pen? Start with the pen kit box: the reusable pen, a dual-chamber vial, needles and a booklet. Already have the pen? Order dual-chamber vials to refill it. Choose the vial if you already have bacteriostatic water and your own supplies; it&apos;s the lowest price.
          </Typography>
          <FormatComparison />
        </Box>
      </Section>

      <Section tone="white" tight aria-labelledby="faq-title">
        <Box sx={{ maxWidth: 840, mx: "auto" }}>
          <Typography id="faq-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em", mb: 2.5 }}>Questions</Typography>
          <FaqAccordion items={FAQ} />
          <ButtonLink href="/shop" variant="contained" size="large" sx={{ mt: 4 }}>Shop all products</ButtonLink>
        </Box>
      </Section>
    </>
  )
}
