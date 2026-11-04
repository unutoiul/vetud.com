import Box from "@mui/material/Box"
import Chip from "@mui/material/Chip"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import ArticleArt from "@/components/learn/ArticleArt"
import ArticleCard, { ArticleHeadline } from "@/components/learn/ArticleCard"
import ResearchCatalog from "@/components/learn/ResearchCatalog"
import RichText from "@/components/learn/RichText"
import SourceList, { LEARN_DISCLAIMER } from "@/components/learn/SourceList"
import VideoResources from "@/components/learn/VideoResources"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { ARTICLES, formatArticleDate, getArticle } from "@/content/learn/articles"
import { getPeptide } from "@/content/learn/peptides"
import { getArticleVideoResources } from "@/content/learn/video-resources"
import { getLearnShopLinks } from "@/lib/learn-shop"
import { gutter } from "@/theme/tokens"

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/news/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  return article ? { title: article.headline.join(""), description: article.dek } : { title: "Not found" }
}

export default function ArticlePage({ params }: PageProps<"/[countryCode]/news/[slug]">) {
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height={640} />}>
      <ArticleContent params={params} />
    </Suspense>
  )
}

const callout = { p: { xs: 2.5, md: 3 }, borderRadius: "12px", border: "1px solid", borderColor: "divider" }

async function ArticleContent({ params }: Pick<PageProps<"/[countryCode]/news/[slug]">, "params">) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()
  const illustration = getLearnIllustration(article.slug)
  const peptides = article.peptides.flatMap((id) => {
    const peptide = getPeptide(id)
    return peptide ? [peptide] : []
  })
  const relevance = (other: (typeof ARTICLES)[number]) =>
    Number(other.topic === article.topic) + other.peptides.filter((id) => article.peptides.includes(id)).length
  const more = ARTICLES.filter((other) => other.slug !== article.slug).sort((a, b) => relevance(b) - relevance(a)).slice(0, 3)
  const videos = getArticleVideoResources(article.slug, peptides)
  const shop = await getLearnShopLinks()

  return (
    <>
      {/* Magazine-style cover: original illustration, headline with its key phrase highlighted. */}
      <Box component="header" sx={{ position: "relative", overflow: "hidden", bgcolor: illustration ? "brand.paper" : "#0a1430", color: illustration ? "text.primary" : "#fff" }}>
        {illustration ? (
          <Box sx={{ maxWidth: 1360, mx: "auto", px: gutter, pt: { xs: 3, md: 5 } }}>
            <ArticleArt variant={article.art} imageKey={article.slug} preload uid={`hero-${article.slug}`} sx={{ aspectRatio: "1672 / 941", borderRadius: "12px" }} />
          </Box>
        ) : <ArticleArt variant={article.art} uid={`hero-${article.slug}`} sx={{ position: "absolute", inset: 0 }} />}
        {!illustration ? <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(5,9,26,.96) 0%, rgba(5,9,26,.7) 45%, rgba(5,9,26,.15) 100%)" }} /> : null}
        <Box sx={{ position: "relative", px: gutter, pt: illustration ? { xs: 3, md: 5 } : { xs: 18, md: 26 }, pb: { xs: 5, md: 7 } }}>
          <Box sx={{ maxWidth: 1000, mx: "auto" }}>
            <Typography sx={{ fontSize: 13, color: illustration ? "text.secondary" : "brand.onNavyMuted", display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              <Box component="span" sx={{ color: illustration ? "brand.blue" : "brand.cyan", fontWeight: 700 }}>{article.kind}</Box>
              <span>{article.topic}</span>
              <Box component="time" dateTime={article.date}>{formatArticleDate(article.date)}</Box>
            </Typography>
            <Typography component="h1" sx={{ mt: 2, fontSize: { xs: 34, sm: 44, md: 58 }, fontWeight: 700, lineHeight: 1.08, letterSpacing: "-.035em", textWrap: "balance" }}>
              <ArticleHeadline headline={article.headline} highlight={illustration ? "brand.blue" : "brand.cyan"} />
            </Typography>
            <Typography sx={{ mt: 2.5, fontSize: { xs: 17, md: 20 }, lineHeight: 1.6, color: illustration ? "text.secondary" : "rgba(255,255,255,.86)", maxWidth: 760 }}>{article.dek}</Typography>
            <Typography sx={{ mt: 3, fontSize: 12.5, letterSpacing: ".08em", textTransform: "uppercase", color: illustration ? "text.secondary" : "brand.onNavyMuted" }}>By VETUD Learn</Typography>
          </Box>
        </Box>
      </Box>

      <Section tone="white" sx={{ py: { xs: 5, md: 8 } }}>
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
          <Box component="section" aria-labelledby="glance-title" sx={{ ...callout, bgcolor: "brand.mintWash" }}>
            <Typography id="glance-title" component="h2" sx={{ fontSize: 19, fontWeight: 700, mb: 2 }}>{article.kind === "Study" ? "The study at a glance" : "At a glance"}</Typography>
            <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "150px 1fr" }, columnGap: 2.5, rowGap: { xs: .25, sm: 1.5 } }}>
              {article.glance.map((item) => (
                <Box key={item.label} sx={{ display: "contents" }}>
                  <Box component="dt" sx={{ fontSize: 13.5, fontWeight: 650, color: "text.primary", mt: { xs: 1.25, sm: 0 } }}>{item.label}</Box>
                  <Box component="dd" sx={{ m: 0, fontSize: 15, color: "text.secondary", lineHeight: 1.6 }}>{item.value}</Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: { xs: 4, md: 5 }, display: "grid", gap: 2.5 }}>
            {article.body.map((paragraph, index) => <Typography key={index} sx={{ fontSize: { xs: 17, md: 18 }, lineHeight: 1.85, color: index === 0 ? "text.primary" : "text.secondary" }}><RichText text={paragraph} shop={shop} /></Typography>)}
          </Box>

          <Box sx={{ mt: { xs: 4, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <Box sx={callout}>
              <Typography component="h2" sx={{ fontSize: 17, fontWeight: 700, mb: 1 }}>What it means</Typography>
              <Typography sx={{ color: "text.secondary", lineHeight: 1.75 }}><RichText text={article.means} shop={shop} /></Typography>
            </Box>
            <Box sx={{ ...callout, bgcolor: "#fbf6ec", borderColor: "#f0e2c4" }}>
              <Typography component="h2" sx={{ fontSize: 17, fontWeight: 700, mb: 1 }}>What we don’t know yet</Typography>
              <Typography sx={{ color: "text.secondary", lineHeight: 1.75 }}><RichText text={article.unknowns} shop={shop} /></Typography>
            </Box>
          </Box>

          {peptides.length ? (
            <Box sx={{ mt: { xs: 4, md: 5 } }}>
              <Typography component="h2" sx={{ fontSize: 17, fontWeight: 700, mb: 1.5 }}>Read more in the library</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {peptides.map((peptide) => <Chip key={peptide.slug} component={AppLink} href={`/learn/${peptide.slug}`} clickable label={peptide.name} variant="outlined" sx={{ fontSize: 14, height: 36, textDecoration: "none" }} />)}
              </Box>
            </Box>
          ) : null}

          <ResearchCatalog peptides={article.peptides} />

          <Box sx={{ mt: { xs: 4, md: 5 }, pt: { xs: 4, md: 5 }, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography component="h2" sx={{ fontSize: 17, fontWeight: 700, mb: 2 }}>Sources</Typography>
            <SourceList sources={article.sources} />
            <Typography sx={{ mt: 4, fontSize: 13, color: "text.secondary" }}>{LEARN_DISCLAIMER}</Typography>
          </Box>
        </Box>

        <Box component="section" sx={{ mt: { xs: 5, md: 7 }, pt: { xs: 4, md: 5 }, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography component="h2" sx={{ fontSize: { xs: 24, md: 28 }, fontWeight: 600, mb: 2 }}>Watch: videos connected to this article</Typography>
          <VideoResources videos={videos.videos} connections={videos.connections} introduction={videos.introduction} currentArticle={article.slug} />
        </Box>

        <Box sx={{ mt: { xs: 7, md: 10 }, pt: { xs: 5, md: 6 }, borderTop: "1px solid", borderColor: "divider" }}>
          <Typography component="h2" sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 600, letterSpacing: "-.03em", mb: 3 }}>More news & articles</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3.5 }}>
            {more.map((other) => <ArticleCard key={other.slug} article={other} />)}
          </Box>
        </Box>
      </Section>
    </>
  )
}
