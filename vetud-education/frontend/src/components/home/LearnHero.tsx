import { getContentTranslator } from "@/i18n/server-content"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { getTranslations } from "next-intl/server"
import { translateAction } from "@/i18n/actions"
import { CATEGORIES } from "@/content/learn/categories"
import { PEPTIDES } from "@/content/learn/peptides"
import { brand, gutter } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { ButtonLink, LocalizedNextLink } from "../common/links"
import PeptideExplorer from "./PeptideExplorer"

/** Start with curiosity, then let visitors explore the science and its evidence. */
export default async function LearnHero() {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const t = await getTranslations("LearnHero")
  const topics = CATEGORIES.filter(category => PEPTIDES.some(peptide => peptide.category === category.id))
  return <Box component="section" aria-labelledby="hero-title" sx={{ bgcolor: brand.mintWash, borderBottom: "1px solid", borderColor: "divider", px: gutter, pt: { xs: 5, md: 7 }, pb: { xs: 4, md: 5 } }}>
    <Box sx={{ maxWidth: 1360, mx: "auto", display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: { xs: 4, md: 6, lg: 9 }, alignItems: "center" }}>
      <Box>
        <Typography component="h1" id="hero-title" sx={{ maxWidth: 650, fontSize: { xs: 48, sm: 64, md: 64, lg: 82 }, fontWeight: 400, letterSpacing: "-.065em", lineHeight: 1.02, textWrap: "balance" }}>{ct("Peptides, explained. Real people, real experiences.")}</Typography>
        <Typography sx={{ maxWidth: 510, color: brand.navySoft, mt: 3, fontSize: { xs: 17, md: 18 }, lineHeight: 1.8 }}>{ct("Many peptides are sold for research only and aren’t approved for people. We know some people take them anyway. Learn what the research really shows, then join our community, where people share what they noticed, including side effects, so nobody has to figure it out alone.")}</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5, alignItems: { xs: "stretch", sm: "center" } }}>
          <ButtonLink href="/learn" variant="contained" endIcon={<Icon name="arrowRight" />}>{t("library")}</ButtonLink>
          <ButtonLink href="/community" variant="outlined" endIcon={<Icon name="arrowRight" />}>{ct("Join the community")}</ButtonLink>
        </Stack>
        <Box sx={{ mt: { xs: 3, md: 5 }, display: "flex", gap: 1.25, alignItems: "flex-start", color: brand.navySoft }}>
          <Icon name="document" sx={{ fontSize: 20, mt: .3, color: brand.blue }} />
          <Typography sx={{ fontSize: 13, lineHeight: 1.7 }}>{ct("Plain-language explanations. Linked sources. Room for uncertainty.")}</Typography>
        </Box>
      </Box>
      <PeptideExplorer />
    </Box>
    <Box component="nav" aria-label={t("topics")} sx={{ maxWidth: 1360, mx: "auto", mt: { xs: 4, md: 5 }, pt: 3, borderTop: "1px solid", borderColor: brand.lineStrong }}>
      <Typography sx={{ fontSize: 13, fontWeight: 600, color: brand.navySoft, mb: 1.5 }}>{t("topics")}</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {topics.map(topic => <Box key={topic.id} component={LocalizedNextLink} href={`/learn#${topic.id}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, minHeight: 44, px: 1.75, borderRadius: 999, border: "1px solid", borderColor: brand.lineStrong, bgcolor: "background.paper", color: "text.primary", textDecoration: "none", fontSize: 13, fontWeight: 500, "&:hover": { borderColor: brand.blue, color: brand.blue }, "&:focus-visible": { outline: `2px solid ${brand.blue}`, outlineOffset: 3 } }}>
          <Icon name={topic.icon} sx={{ fontSize: 17, color: brand.blue }} />{translateAction(act, topic.name)}
        </Box>)}
      </Box>
    </Box>
  </Box>
}
