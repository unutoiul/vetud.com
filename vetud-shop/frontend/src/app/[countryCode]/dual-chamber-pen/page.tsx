import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { FormatComparison } from "@/components/product/DualChamberExplainer"
import FaqAccordion, { type FaqItem } from "@/components/standards/FaqAccordion"
import { collectionMetadata } from "@/lib/article-seo"
import { PEN_EXPLAINER_IMAGE, REUSABLE_PEN_IMAGE } from "@/lib/product-images"

const TITLE = "The dual-chamber pen, explained"
const DESCRIPTION = "How the reusable VETUD dual-chamber pen works: freeze-dried peptide and bacteriostatic water kept apart in one cartridge, the pen kit box, refill dual-chamber vials, and how they compare with a vial."

export async function generateMetadata() {
  return collectionMetadata({ path: "/dual-chamber-pen", title: `${TITLE}: pen kit box, dual-chamber vial or vial`, description: DESCRIPTION })
}

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

const FAQ: FaqItem[] = [
  { question: "Is bacteriostatic water included?", answer: "With a dual-chamber vial or the pen kit box, yes: it's already in the cartridge's second chamber. With a vial, no: add bacteriostatic water (10 ml or 30 ml) and U-100 syringes from the product page." },
  { question: "What's the difference between the three?", answer: "The amount of peptide is the same. The pen kit box has the reusable pen with one dual-chamber vial, 12 disposable needles and an instruction booklet, in the VETUD box. A dual-chamber vial is the two-chamber cartridge on its own, to refill the pen. A vial is the freeze-dried powder on its own, at the lowest price." },
  { question: "Is the pen reusable?", answer: "Yes. Buy the pen kit box once, keep the pen body, and replace the cartridge with a new dual-chamber vial when it's empty." },
  { question: "Which products come in all three formats?", answer: "Every peptide. Each product page lets you choose a dual-chamber vial, a vial or the pen kit box, and shows the price of each amount. Selank and Semax come as a nasal spray in place of the pen kit box. Bacteriostatic water comes as a cartridge or a vial." },
  { question: "Is the pen for personal use?", answer: "No. Like everything we sell, the pen and the vial are supplied for laboratory research use only, not for human or veterinary use. This page describes the packaging; it isn't a guide to using it." },
]

export default function DualChamberPenPage() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return (
    <>
      <PageHeader eyebrow={ct("Formats")} title={ct(TITLE)} description={ct("Every VETUD peptide comes as a dual-chamber vial, a vial or a pen kit box with the reusable pen. Here's how the pen works, what each one includes, and how to choose.")}>
        <ButtonLink href="/shop" variant="contained" size="large">{act("shopPens")}</ButtonLink>
      </PageHeader>

      <Section tone="paper" tight aria-labelledby="parts-title">
        <Box sx={{ maxWidth: 1040, mx: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: { xs: 4, md: 7 }, alignItems: "center" }}>
          <Box sx={{ position: "relative", aspectRatio: "1 / 1", borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "#eef4fb" }}>
            <Image src={PEN_EXPLAINER_IMAGE} alt={ct("The dual-chamber cartridge on its own and inside the pen, labelled: cartridge holder, lyophilized peptide, BAC water and pen body")} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "contain" }} />
          </Box>
          <Box>
            <Typography id="parts-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em" }}>{ct("How it's built")}</Typography>
            <Box component="dl" sx={{ mt: 2.5, mb: 0, display: "grid", gap: 2.25 }}>
              {PARTS.map((part, index) => (
                <Box key={part.name} sx={{ display: "grid", gridTemplateColumns: "32px 1fr", gap: 1.5 }}>
                  <Box aria-hidden sx={{ width: 32, height: 32, borderRadius: "50%", bgcolor: "brand.navy", color: "#fff", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700 }}>{ct(index + 1)}</Box>
                  <Box>
                    <Typography component="dt" sx={{ fontWeight: 650, fontSize: 17, color: "brand.ink" }}>{ct(part.name)}</Typography>
                    <Typography component="dd" sx={{ m: 0, mt: 0.25, fontSize: 15, lineHeight: 1.7, color: "text.secondary" }}>{ct(part.text)}</Typography>
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
            <Image src={REUSABLE_PEN_IMAGE} alt={ct("The reusable VETUD dual-chamber pen, labelled: graduated holder, freeze-dried peptide, diluent and reusable pen body")} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "contain" }} />
          </Box>
          <Box>
            <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue" }}>{ct("Reusable")}</Typography>
            <Typography id="reusable-title" component="h2" sx={{ mt: 1, fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em" }}>{ct("One pen body, many cartridges")}</Typography>
            <Typography sx={{ mt: 1.5, fontSize: 16, lineHeight: 1.75, color: "text.secondary" }}>
              {ct("The VETUD dual-chamber pen is reusable. It comes in the pen kit box; keep the pen body and replace the cartridge with a new dual-chamber vial when it's empty.")}
            </Typography>
            <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 3, p: 0, display: "grid", gap: 2.25 }}>
              {REUSABLE.map((point) => (
                <Box component="li" key={point.name} sx={{ display: "grid", gridTemplateColumns: "28px 1fr", gap: 1.5 }}>
                  <Icon name="checkCircle" sx={{ fontSize: 22, color: "brand.blue", mt: 0.25 }} />
                  <Box>
                    <Typography component="h3" sx={{ fontWeight: 650, fontSize: 17, color: "brand.ink" }}>{ct(point.name)}</Typography>
                    <Typography sx={{ mt: 0.25, fontSize: 15, lineHeight: 1.7, color: "text.secondary" }}>{ct(point.text)}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Section>

      <Section tone="paper" tight aria-labelledby="compare-title">
        <Box sx={{ maxWidth: 840, mx: "auto" }}>
          <Typography id="compare-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em" }}>{ct("Dual-chamber vial, vial or pen kit box: which to choose")}</Typography>
          <Typography sx={{ mt: 1.5, mb: 3, fontSize: 16, lineHeight: 1.75, color: "text.secondary" }}>
            {ct("Same peptide, same amounts. New to the pen? Start with the pen kit box: the reusable pen, a dual-chamber vial, needles and a booklet. Already have the pen? Order dual-chamber vials to refill it. Choose the vial if you already have bacteriostatic water and your own supplies; it's the lowest price.")}
          </Typography>
          <FormatComparison />
        </Box>
      </Section>

      <Section tone="white" tight aria-labelledby="faq-title">
        <Box sx={{ maxWidth: 840, mx: "auto" }}>
          <Typography id="faq-title" component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 500, letterSpacing: "-.03em", mb: 2.5 }}>{act("questions")}</Typography>
          <FaqAccordion items={FAQ} />
          <ButtonLink href="/shop" variant="contained" size="large" sx={{ mt: 4 }}>{act("shopCatalog")}</ButtonLink>
        </Box>
      </Section>
    </>
  )
}
