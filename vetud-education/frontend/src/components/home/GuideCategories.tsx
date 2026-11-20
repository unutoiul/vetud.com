import { getTranslations } from "next-intl/server"
import Image from "next/image"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { CATEGORIES, type CategoryId } from "@/content/learn/categories"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { PEPTIDES } from "@/content/learn/peptides"
import { translateAction } from "@/i18n/actions"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import { brand } from "@/theme/tokens"

const artwork: Record<CategoryId, string> = {
  weight: "mazdutide", skin: "matrixyl", pigmentation: "melanotan", hair: "ahk-cu",
  recovery: "bpc-157", energy: "ss-31", growth: "peg-mgf", focus: "dihexa",
  calm: "selank", sleep: "dsip", longevity: "foxo4-dri", intimacy: "pt-141",
  fertility: "gonadorelin", immune: "thymalin", medicines: "pramlintide",
}
/** Illustrations whose subject sits small in the frame: zoomed in so a thumbnail still shows it. */
const zoomed = new Set<CategoryId>(["pigmentation", "hair", "recovery", "energy", "calm", "sleep", "intimacy"])

const INK = brand.blue825
const LINE = brand.stone200

/**
 * Every topic at once in a compact grid, so nothing scrolls sideways (owner request 2026-11-18).
 * Each card goes to that topic in the guide library.
 */
export default async function GuideCategories() {
  const [actions, t] = await Promise.all([getTranslations("Actions"), getTranslations("LearnHero")])
  const categories = CATEGORIES.map(({ id, name }) => ({
    id, name: translateAction(actions, name), cover: getLearnIllustration(artwork[id])!.src,
    count: t("guideCount", { count: PEPTIDES.filter(guide => guide.category === id).length }),
  }))

  return <Box component="section" aria-labelledby="guide-categories-heading" sx={{ color: INK, bgcolor: brand.amber75 }}>
    <Box sx={{ maxWidth: 1520, mx: "auto", px: { xs: "max(18px, 5vw)", md: "clamp(24px, 5vw, 80px)" }, py: { xs: 3, md: 5 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "4px 18px", mb: { xs: 2, md: 2.5 } }}>
        <Typography id="guide-categories-heading" component="h2" variant="inherit" sx={{ m: 0, font: "inherit", fontWeight: 500, lineHeight: 1.1, fontSize: { xs: 24, md: "clamp(28px, 2.4vw, 36px)" }, letterSpacing: "-.045em" }}>
          {t("categoryTitle")}
        </Typography>
        <AppLink href="/learn" underline="hover" sx={{ display: "inline-flex", minHeight: 44, alignItems: "center", gap: 0.75, color: "inherit", fontSize: 14, fontWeight: 600, textUnderlineOffset: "4px" }}>
          {t("allGuides")} <Icon name="arrowUpRight" sx={{ fontSize: 16 }} />
        </AppLink>
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: { xs: 1, md: 1.5 } }}>
        {categories.map(category =>
          <Box component="li" key={category.id} sx={{ minWidth: 0 }}>
            <AppLink href={`/learn#${category.id}`} underline="none"
              sx={{
                display: "flex", alignItems: "center", gap: { xs: 1, md: 1.5 }, height: "100%", minHeight: { xs: 48, md: 64 }, p: { xs: 0.75, md: 1 }, pr: { xs: 1, md: 1.5 },
                border: `1px solid ${LINE}`, borderRadius: "10px", bgcolor: brand.amber25, color: INK, fontWeight: 400,
                transition: "border-color .2s ease, box-shadow .2s ease",
                "&:hover": { borderColor: brand.slate700, boxShadow: `0 6px 18px ${brand.blue825A08}` },
                "&:hover .category-name": { textDecoration: "underline", textUnderlineOffset: "3px" },
                "&:focus-visible": { outline: `3px solid ${brand.teal725}`, outlineOffset: "2px" },
              }}>
              <Box component="span" sx={{ position: "relative", width: { xs: 34, md: 52 }, height: { xs: 34, md: 52 }, flexShrink: 0, overflow: "hidden", borderRadius: { xs: "6px", md: "8px" }, bgcolor: brand.stone125 }}>
                <Image src={category.cover} alt="" fill sizes="56px"
                  style={{ objectFit: "cover", ...(zoomed.has(category.id) ? { transform: "scale(1.45)", transformOrigin: "72% 85%" } : {}) }} />
              </Box>
              <Box component="span" sx={{ display: "grid", minWidth: 0, flex: 1 }}>
                <Typography component="strong" className="category-name" sx={{ fontWeight: 600, fontSize: { xs: 13, md: 16 }, lineHeight: 1.2, letterSpacing: "-.02em", overflowWrap: "anywhere" }}>{category.name}</Typography>
                <Typography component="small" sx={{ fontSize: { xs: 11, md: 12 }, color: brand.gray650 }}>{category.count}</Typography>
              </Box>
            </AppLink>
          </Box>
        )}
      </Box>
    </Box>
  </Box>
}
