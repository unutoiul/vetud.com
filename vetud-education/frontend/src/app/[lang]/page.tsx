import { getContentTranslator } from "@/i18n/server-content"
import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import type { Metadata } from "next"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import LearnHero from "@/components/home/LearnHero"
import ArticleCard from "@/components/learn/ArticleCard"
import VideoGallery from "@/components/learn/VideoGallery"
import WeightLossChart from "@/components/learn/WeightLossChart"
import { ARTICLES } from "@/content/learn/articles"
import { getVideos } from "@/content/learn/videos"
import { articleUrl, collectionMetadata } from "@/lib/article-seo"
import { SITE } from "@/lib/config"

export async function generateMetadata(): Promise<Metadata> {
  return collectionMetadata({
    title: "Peptides Explained: Research Guides, News and Videos",
    description: "Plain-language guides to peptide research, including Retatrutide, Tirzepatide and Semaglutide: the evidence, the risks and what is approved.",
    path: "",
  })
}

export default async function HomePage() {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const website = { "@context": "https://schema.org", "@type": "WebSite", name: SITE.name, url: articleUrl("", ct.locale), inLanguage: ct.locale }
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, "\\u003c") }} />
    <LearnHero />

    <Section tone="white" sx={{ py: { xs: 6, md: 9 } }}>
      <SectionHeading eyebrow={ct("Results")} title={ct("What the weight-loss trials found.")} description={ct("Average weight lost in the main published trials of today’s leading medicines, each compared with a placebo.")} action={<ButtonLink href="/learn#weight" variant="outlined" endIcon={<Icon name="arrowRight" />}>{act("weightGuides")}</ButtonLink>} />
      <WeightLossChart />
    </Section>

    <Section tone="paper" sx={{ py: { xs: 6, md: 9 } }}>
      <SectionHeading eyebrow={ct("News & articles")} title={ct("New research, explained.")} description={ct("Recent studies and decisions, written so anyone can follow them, with every source linked.")} action={<ButtonLink href="/news" variant="outlined" endIcon={<Icon name="arrowRight" />}>{act("allArticles")}</ButtonLink>} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: { xs: 4, md: 3.5 } }}>
        {ARTICLES.slice(1, 4).map((article) => <ArticleCard key={article.slug} article={article} />)}
      </Box>
    </Section>

    <Section tone="white" sx={{ py: { xs: 6, md: 9 } }}>
      <SectionHeading eyebrow={ct("Videos")} title={ct("Doctors explain.")} description={ct("Hand-picked videos, mostly from doctors, including some skeptical ones.")} action={<ButtonLink href="/videos" variant="outlined" endIcon={<Icon name="arrowRight" />}>{act("allVideos")}</ButtonLink>} />
      <VideoGallery videos={getVideos(["o8YMLTfNYtc", "QGIFdakceHM", "xpdLs-_nl4g"])} />
    </Section>
  </>
}
