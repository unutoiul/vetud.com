import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { getTranslations } from "next-intl/server"
import Image from "next/image"
import { ARTICLES, formatArticleDate } from "@/content/learn/articles"
import { CATEGORIES } from "@/content/learn/categories"
import { PEPTIDES } from "@/content/learn/peptides"
import { brand, gutter } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { ButtonLink, LocalizedNextLink } from "../common/links"
import ArticleArt from "../learn/ArticleArt"
import { ArticleHeadline } from "../learn/ArticleCard"

/** Learning-first homepage hero: the promise on the left, the newest article on the right, topics below. */
export default async function LearnHero() {
  const t = await getTranslations("LearnHero")
  const latest = ARTICLES[0]
  const topics = CATEGORIES.filter((category) => PEPTIDES.some((peptide) => peptide.category === category.id))
  return (
    <Box component="section" aria-labelledby="hero-title" sx={{ position: "relative", overflow: "hidden", bgcolor: brand.paper, borderBottom: "1px solid", borderColor: "divider" }}>
      <Box sx={{ position: "absolute", inset: "auto 0 0", height: { xs: 260, md: 300 }, pointerEvents: "none", opacity: .7 }}>
        <Image src="/images/vetud-alpine-landscape.webp" alt="" fill preload sizes="100vw" style={{ objectFit: "cover", objectPosition: "center 80%", maskImage: "linear-gradient(to bottom, transparent, black 45%, black 85%, transparent)" }} />
      </Box>
      <Box sx={{ position: "relative", px: gutter, pt: { xs: 5, md: 8 }, pb: { xs: 4, md: 6 } }}>
        <Box sx={{ maxWidth: 1360, mx: "auto", display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) minmax(0, 1.05fr)" }, gap: { xs: 5, md: 6, lg: 8 }, alignItems: "center" }}>
          <Box>
            <Typography component="h1" id="hero-title" sx={{ fontSize: { xs: 44, sm: 58, md: 58, lg: 70 }, fontWeight: 400, letterSpacing: "-.06em", lineHeight: 1.04, textWrap: "balance" }}>
              {t("first")}<br /><Box component="span" sx={{ color: "brand.blue" }}>{t("second")}</Box>
            </Typography>
            <Typography sx={{ maxWidth: 520, color: "brand.navySoft", mt: 3, fontSize: { xs: 16, md: 18 }, lineHeight: 1.75 }}>{t("description", { count: PEPTIDES.length })}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3.5, alignItems: { xs: "stretch", sm: "center" } }}>
              <ButtonLink href="/learn" variant="contained" endIcon={<Icon name="arrowRight" />}>{t("library")}</ButtonLink>
              <ButtonLink href="/news" variant="outlined" sx={{ bgcolor: "#ffffffcc" }}>{t("news")}</ButtonLink>
            </Stack>
          </Box>

          {latest ? (
            <Box component="article" sx={{ position: "relative", borderRadius: "14px", overflow: "hidden", aspectRatio: { xs: "4 / 3", md: "5 / 4" }, boxShadow: "0 24px 60px rgba(13,24,56,.18)", "&:focus-within": { outline: "3px solid", outlineColor: "brand.blue", outlineOffset: 4 }, "&:hover .hero-art": { transform: "scale(1.03)" } }}>
              <ArticleArt className="hero-art" variant={latest.art} uid="home-hero" sx={{ position: "absolute", inset: 0, transition: "transform .6s ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }} />
              <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", p: { xs: 2.5, md: 4 }, color: "#fff", background: "linear-gradient(0deg, rgba(5,9,26,.92), rgba(5,9,26,.35) 55%, transparent)" }}>
                <Typography sx={{ fontSize: 12.5, color: "brand.onNavyMuted", display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <Box component="span" sx={{ color: "brand.cyan", fontWeight: 700 }}>{t("latest")}</Box>
                  <Box component="time" dateTime={latest.date}>{formatArticleDate(latest.date)}</Box>
                </Typography>
                <Typography component="h2" sx={{ mt: 1, fontSize: { xs: 24, md: 32 }, fontWeight: 700, lineHeight: 1.12, letterSpacing: "-.03em", textWrap: "balance" }}>
                  <Box component={LocalizedNextLink} href={`/news/${latest.slug}`} sx={{ color: "inherit", textDecoration: "none", "&::after": { content: '""', position: "absolute", inset: 0 }, "&:focus-visible": { outline: "none" } }}>
                    <ArticleHeadline headline={latest.headline} />
                  </Box>
                </Typography>
                <Typography sx={{ mt: 1.25, fontSize: 14.5, lineHeight: 1.6, color: "rgba(255,255,255,.82)", display: { xs: "none", sm: "block" } }}>{latest.dek}</Typography>
              </Box>
            </Box>
          ) : null}
        </Box>

        <Box component="nav" aria-label={t("topics")} sx={{ maxWidth: 1360, mx: "auto", mt: { xs: 5, md: 7 } }}>
          <Typography sx={{ fontSize: 13, fontWeight: 650, color: "text.secondary", mb: 1.5 }}>{t("topics")}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {topics.map((topic) => (
              <Box key={topic.id} component={LocalizedNextLink} href={`/learn#${topic.id}`} sx={{ display: "inline-flex", alignItems: "center", gap: 1, minHeight: 44, px: 2, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "#fff", color: "text.primary", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "border-color .15s ease, color .15s ease", "&:hover": { borderColor: "brand.blue", color: "brand.blue" } }}>
                <Icon name={topic.icon} sx={{ fontSize: 18, color: "brand.blue" }} />{topic.name}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
