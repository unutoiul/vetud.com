"use client"

import { useId, useState } from "react"
import Image from "next/image"
import { useFormatter, useTranslations } from "next-intl"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import type { WeightLossTrial } from "@/content/learn/weight-loss-trials"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"

type Guide = WeightLossTrial & { cover: string; mechanism: string }

/** Below 760px the hero stacks: picture above the result (LearnHero uses the same width). */
const narrow = "@media (max-width: 759.95px)"

const linkSx = {
  display: "inline-flex", alignItems: "center", gap: "7px", minHeight: 44, fontSize: 14, textUnderlineOffset: "4px",
  "&:focus-visible": { outline: "2px solid", outlineColor: "brand.cyan", outlineOffset: "3px" },
} as const

export default function PeptideExplorer({ guides }: { guides: Guide[] }) {
  const [index, setIndex] = useState(0)
  const [hasSelected, setHasSelected] = useState(false)
  const panelId = useId()
  const reducedMotion = useReducedMotion()
  const t = useTranslations("LearnHero")
  const format = useFormatter()
  const guide = guides[index]
  const percent = (value: number) => format.number(value / 100, {
    style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1,
  })

  return (
    <LazyMotion features={domAnimation}>
      <Box role="group" aria-label={t("featured")} sx={{ display: "flex", flexWrap: "wrap", gap: "clamp(4px, 1vw, 16px)" }}>
        {guides.map((item, i) => (
          <ButtonBase
            key={item.peptide}
            aria-pressed={i === index}
            aria-controls={panelId}
            onClick={() => { setHasSelected(true); setIndex(i) }}
            sx={{
              font: "inherit", minHeight: 46, px: "clamp(5px, 1.1vw, 16px)", py: "6px",
              fontSize: "clamp(13px, 1.15vw, 16px)", fontWeight: 600, color: "brand.navySoft",
              borderBottom: "3px solid transparent",
              "&[aria-pressed=\"true\"]": { color: "brand.navy", borderBottomColor: "currentColor" },
              "&:hover": { bgcolor: "brand.mintLight" },
              "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: "-3px" },
            }}
          >
            {item.medicine}
          </ButtonBase>
        ))}
      </Box>
      <Box id={panelId} aria-live="polite" aria-atomic="true" sx={{ overflow: "hidden", borderRadius: "0 18px 18px 18px", bgcolor: "brand.navyDeep", color: "brand.onNavy" }}>
        <m.div
          key={guide.peptide}
          initial={hasSelected && !reducedMotion ? { opacity: 0.6, x: 12 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: "1.08fr 1fr", [narrow]: { gridTemplateColumns: "minmax(0, 1fr)" } }}>
            <Box sx={{ position: "relative", overflow: "hidden", bgcolor: "brand.mintLight", [narrow]: { aspectRatio: "16 / 9" } }}>
              <Image src={guide.cover} alt="" fill sizes="(min-width: 1400px) 700px, (min-width: 760px) 52vw, 100vw" loading={index === 0 ? "eager" : "lazy"} style={{ objectFit: "cover" }} />
            </Box>
            <Box component="article" sx={{ alignSelf: "center", p: "clamp(22px, 3.2vw, 48px)", [narrow]: { p: "22px clamp(18px, 5vw, 36px) 12px" } }}>
              <Typography component="h2" variant="inherit" sx={{ m: 0, fontSize: "clamp(17px, 1.6vw, 23px)", fontWeight: 500, color: "brand.onNavyMuted" }}>
                {guide.mechanism}
              </Typography>
              <Typography variant="inherit" component="p" sx={{ mt: "16px", fontSize: "clamp(56px, 6.6vw, 98px)", fontWeight: 500, letterSpacing: "-.075em", lineHeight: 1, [narrow]: { mt: "10px" } }}>
                {percent(guide.medicineLoss)}
              </Typography>
              <Typography variant="inherit" component="p" sx={{ mt: "5px", fontSize: "clamp(17px, 1.65vw, 24px)", lineHeight: 1.35, letterSpacing: "-.025em" }}>
                {t("measure", { weeks: guide.weeks })}
              </Typography>
              <Typography variant="inherit" component="p" sx={{ mt: "12px", color: "brand.onNavyMuted", fontSize: 15, lineHeight: 1.6, maxWidth: "47ch" }}>
                {t(guide.trial === "STEP 1" ? "singleGroup" : "highestGroup", {
                  count: guide.people, placebo: percent(guide.placeboLoss),
                  trial: guide.trial === "Phase 2" ? t("phaseTwo") : guide.trial,
                })}
              </Typography>
              <Box sx={{ mt: "15px", display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: "24px", [narrow]: { mt: "8px" } }}>
                <AppLink href={`/learn/${guide.peptide}`} underline="hover" sx={{ ...linkSx, color: "brand.onNavy", fontWeight: 600 }}>
                  {t("readGuide", { name: guide.medicine })}<Icon name="arrowRight" sx={{ fontSize: 18 }} />
                </AppLink>
                <Link href={guide.source} target="_blank" rel="noopener noreferrer" underline="always" sx={{ ...linkSx, color: "brand.onNavyMuted", fontWeight: 400 }}>
                  {t("study")}
                </Link>
              </Box>
            </Box>
          </Box>
        </m.div>
      </Box>
    </LazyMotion>
  )
}
