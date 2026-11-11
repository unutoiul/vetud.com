import { getContentTranslator } from "@/i18n/server-content"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { AppLink, ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import { getCategory } from "@/content/learn/categories"
import type { PlannedPeptide } from "@/content/learn/planned-peptides"
import ArticleArt from "./ArticleArt"

/** The page for a peptide whose guide isn't written yet: its name, topic and a short note. */
export default async function PlannedGuide({ peptide }: { peptide: PlannedPeptide }) {
  const ct = await getContentTranslator()
  const category = getCategory(peptide.category)
  return (
    <Section tone="paper" tight>
      <Box component="article" lang={ct.locale} sx={{ maxWidth: 760, mx: "auto" }}>
        <Box component="nav" aria-label={ct("Breadcrumb")} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, fontSize: 13, color: "text.secondary" }}>
          <AppLink href="/learn" sx={{ minHeight: 32, display: "inline-flex", alignItems: "center" }}>{ct("Education")}</AppLink>
          <Box component="span" aria-hidden>/</Box>
          <AppLink href={`/learn#${category.id}`} sx={{ minHeight: 32, display: "inline-flex", alignItems: "center" }}>{ct(category.name)}</AppLink>
        </Box>
        <Typography component="h1" variant="h2" sx={{ mt: { xs: 2.5, md: 3.5 } }}>{ct(peptide.name)}</Typography>
        {peptide.aka ? <Typography sx={{ mt: 1, fontSize: 15, color: "text.secondary" }}>{ct.template("Also known as {v0}", { v0: peptide.aka })}</Typography> : null}
        <Box sx={{ position: "relative", height: { xs: 150, md: 200 }, mt: { xs: 3, md: 4 }, borderRadius: "12px", overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
          <ArticleArt variant="triple" uid={`planned-${peptide.slug}`} sx={{ position: "absolute", inset: 0 }} />
        </Box>
        <Box role="status" sx={{ mt: { xs: 3, md: 4 }, p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", borderLeft: "3px solid", borderColor: "brand.blue", borderRadius: "0 8px 8px 0" }}>
          <Typography component="h2" sx={{ fontSize: 19, fontWeight: 650, color: "brand.navy" }}>{ct("Guide coming soon")}</Typography>
          <Typography sx={{ mt: 1, fontSize: 15.5, lineHeight: 1.7, color: "brand.navySoft" }}>
            {ct.template("We're writing our guide to {v0}. It will explain what it is, what the research shows and what isn't known yet, with sources.", { v0: peptide.name })}
          </Typography>
        </Box>
        <ButtonLink href={`/learn#${category.id}`} variant="outlined" endIcon={<Icon name="arrowRight" />} sx={{ mt: 3.5, minHeight: 44 }}>
          {ct.template("More guides in {v0}", { v0: category.name })}
        </ButtonLink>
      </Box>
    </Section>
  )
}
