import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import ArticleCard from "@/components/learn/ArticleCard"
import ArticleComments from "@/components/learn/ArticleComments"
import ResearchCatalog from "@/components/learn/ResearchCatalog"
import RichText from "@/components/learn/RichText"
import { ArticleJsonLd, ReadingHeader, ReadingLayout, ReadingSection, readingProse } from "@/components/learn/ReadingLayout"
import SourceList, { LEARN_DISCLAIMER } from "@/components/learn/SourceList"
import VideoResources from "@/components/learn/VideoResources"
import { ARTICLES, formatArticleDate, getArticle } from "@/content/learn/articles"
import { getLearnIllustration } from "@/content/learn/illustrations"
import { ARTICLE_SEARCH_TITLES } from "@/content/learn/search-titles"
import { getPeptide } from "@/content/learn/peptides"
import { getArticleVideoResources } from "@/content/learn/video-resources"
import { articleMetadata, articleStructuredData, readingMinutes } from "@/lib/article-seo"
import { getLearnShopLinks } from "@/lib/learn-shop"

export function generateStaticParams() {
  return ARTICLES.map(article => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/news/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)
  return article ? articleMetadata({ title: ARTICLE_SEARCH_TITLES[article.slug] ?? article.headline.join(""), description: article.dek, path: `/news/${article.slug}`, image: getLearnIllustration(article.slug) }) : { title: "Not found", robots: { index: false } }
}

export default function ArticlePage({ params }: PageProps<"/[countryCode]/news/[slug]">) {
  return <Suspense fallback={<Skeleton variant="rectangular" height={640} />}><ArticleContent params={params} /></Suspense>
}

async function ArticleContent({ params }: Pick<PageProps<"/[countryCode]/news/[slug]">, "params">) {
  const { slug } = await params
  const article = getArticle(slug)
  if (!article) notFound()
  const peptides = article.peptides.flatMap(id => { const peptide = getPeptide(id); return peptide ? [peptide] : [] })
  const relevance = (other: (typeof ARTICLES)[number]) => Number(other.topic === article.topic) + other.peptides.filter(id => article.peptides.includes(id)).length
  const more = ARTICLES.filter(other => other.slug !== article.slug).sort((a, b) => relevance(b) - relevance(a)).slice(0, 3)
  const videos = getArticleVideoResources(article.slug, peptides)
  const shop = await getLearnShopLinks()
  const image = getLearnIllustration(article.slug)
  const title = article.headline.join("")
  const text = [article.dek, ...article.glance.map(item => item.value), ...article.body, article.means, article.unknowns]
  const contents = [
    { id: "at-a-glance", label: "At a glance" }, { id: "research", label: "The research, explained" },
    { id: "meaning", label: "What it means" }, { id: "unknowns", label: "What we don’t know" },
    ...(peptides.length ? [{ id: "related-guides", label: "Related peptide guides" }] : []),
    { id: "videos", label: "Watch and learn" }, { id: "sources", label: "Sources and references" },
    { id: "research-shop", label: "Related research products" }, { id: "comments", label: "Comments" },
  ]
  const data = articleStructuredData({ title, description: article.dek, path: `/news/${article.slug}`, image, sources: article.sources, text,
    breadcrumbs: [{ name: "Home", path: "" }, { name: "News and articles", path: "/news" }, { name: title, path: `/news/${article.slug}` }],
  })

  return <>
    <Box component="article" lang="en" aria-labelledby="article-title">
      <ArticleJsonLd data={data} />
      <ReadingHeader title={title} description={article.dek} image={image} variant={article.art} uid={`hero-${article.slug}`} minutes={readingMinutes(text)}
        breadcrumbs={[{ label: "News and articles", href: "/news" }, { label: article.topic }]}
        meta={<><Typography component="span" sx={{ px: 1.25, py: .375, borderRadius: 99, bgcolor: "brand.mint", color: "brand.navy", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{article.kind}</Typography><time dateTime={article.date}>{formatArticleDate(article.date)}</time></>} />
      <ReadingLayout items={contents}>
        <ReadingSection id="at-a-glance" title={article.kind === "Study" ? "The study at a glance" : "At a glance"} first>
          <Box component="dl" sx={{ m: 0, p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", borderLeft: "3px solid", borderColor: "brand.blue", borderRadius: "0 8px 8px 0", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "145px minmax(0, 1fr)" }, columnGap: 3, rowGap: { xs: .5, sm: 2 } }}>
            {article.glance.map(item => <Box key={item.label} sx={{ display: "contents" }}>
              <Box component="dt" sx={{ fontSize: 15, fontWeight: 700, color: "brand.navy", mt: { xs: 1.5, sm: 0 }, "&:first-of-type": { mt: 0 } }}>{item.label}</Box>
              <Box component="dd" sx={{ m: 0, fontSize: 16, color: "brand.navySoft", lineHeight: 1.75 }}>{item.value}</Box>
            </Box>)}
          </Box>
        </ReadingSection>
        <ReadingSection id="research" title="The research, explained">
          <Box sx={{ display: "grid", gap: 2.5 }}>{article.body.map((paragraph, index) => <Typography key={index} sx={readingProse}><RichText text={paragraph} shop={shop} /></Typography>)}</Box>
        </ReadingSection>
        <ReadingSection id="meaning" title="What does this mean?"><Typography sx={readingProse}><RichText text={article.means} shop={shop} /></Typography></ReadingSection>
        <ReadingSection id="unknowns" title="What don’t we know yet?"><Typography sx={readingProse}><RichText text={article.unknowns} shop={shop} /></Typography></ReadingSection>
        {peptides.length ? <ReadingSection id="related-guides" title="Understand the peptides in this article">
          <Box component="ul" sx={{ m: 0, pl: 2.5, display: "grid", gap: 1.5 }}>{peptides.map(peptide => <li key={peptide.slug}>
            <AppLink href={`/learn/${peptide.slug}`} sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 17, fontWeight: 650 }}>{peptide.name}: research and safety guide</AppLink>
            <Typography sx={{ fontSize: 15, lineHeight: 1.75, color: "brand.navySoft" }}>{peptide.oneLiner}</Typography>
          </li>)}</Box>
        </ReadingSection> : null}
        <ReadingSection id="videos" title="Watch and learn"><VideoResources videos={videos.videos} connections={videos.connections} introduction={videos.introduction} currentArticle={article.slug} /></ReadingSection>
        <ReadingSection id="sources" title="Sources and references">
          <SourceList sources={article.sources} />
          <Typography sx={{ mt: 3, fontSize: 14, lineHeight: 1.8, color: "brand.navySoft" }}>{LEARN_DISCLAIMER}</Typography>
        </ReadingSection>
        <Box id="research-shop" sx={{ scrollMarginTop: 8 }}><ResearchCatalog peptides={article.peptides} /></Box>
        <ReadingSection id="comments" title="Comments"><ArticleComments article={article.slug} /></ReadingSection>
      </ReadingLayout>
    </Box>
    <Section tone="paper" sx={{ py: { xs: 5, md: 7 }, borderTop: "1px solid", borderColor: "divider" }}>
      <Typography component="h2" sx={{ fontSize: { xs: 25, md: 30 }, fontWeight: 650, color: "brand.navy", mb: 3 }}>Keep reading</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 4 }}>{more.map(other => <ArticleCard key={other.slug} article={other} />)}</Box>
      <AppLink href="/news" sx={{ mt: 3, display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15 }}>Browse all articles</AppLink>
    </Section>
  </>
}
