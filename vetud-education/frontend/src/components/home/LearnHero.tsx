import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { WEIGHT_LOSS_TRIALS } from "@/content/learn/weight-loss-trials"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"
import PeptideExplorer from "./PeptideExplorer"

/** Below 760px the intro stacks (PeptideExplorer uses the same width). */
const narrow = "@media (max-width: 759.95px)"

const featuredTrials = [
  { peptide: "retatrutide", trialName: "Phase 2" },
  { peptide: "tirzepatide", trialName: "SURMOUNT-1" },
  { peptide: "semaglutide", trialName: "STEP 1" },
] as const

export default async function LearnHero() {
  const t = await getTranslations("LearnHero")
  const guides = featuredTrials.flatMap(({ peptide, trialName }) => {
    const trial = WEIGHT_LOSS_TRIALS.find(item => item.peptide === peptide && item.trial === trialName)
    if (!trial) return []
    const cover = getLearnIllustration(trial.peptide)
    return cover ? [{ ...trial, mechanism: t(peptide), cover: cover.src }] : []
  })

  return (
    <Box component="section" aria-labelledby="hero-title" sx={{ color: "brand.ink", bgcolor: "brand.mintWash", py: "clamp(30px, 4.6vw, 68px)", px: "clamp(20px, 4.5vw, 64px)" }}>
      <Box sx={{ maxWidth: 1300, mx: "auto" }}>
        <Box component="header" sx={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: "24px", mb: "clamp(20px, 2.8vw, 38px)", [narrow]: { alignItems: "start", flexDirection: "column", gap: "16px" } }}>
          <div>
            <Typography id="hero-title" component="h1" variant="inherit" sx={{ m: 0, fontSize: "clamp(38px, 5.1vw, 78px)", fontWeight: 500, letterSpacing: "-.06em", lineHeight: 1.06, textWrap: "balance" }}>
              {t("title")}
            </Typography>
            <Typography sx={{ mt: "14px", color: "brand.navySoft", fontSize: "clamp(16px, 1.3vw, 19px)", lineHeight: 1.5, maxWidth: "58ch" }}>
              {t("intro")}
            </Typography>
          </div>
          <ButtonLink href="/learn" variant="contained" endIcon={<Icon name="arrowRight" />} sx={{ whiteSpace: "nowrap" }}>
            {t("browse")}
          </ButtonLink>
        </Box>
        {guides.length > 0 && <PeptideExplorer guides={guides} />}
      </Box>
    </Box>
  )
}
