import { useContentTranslator } from "@/i18n/use-content-translator"
import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import ArticleCard from "@/components/learn/ArticleCard"
import PeptideCard from "@/components/learn/PeptideCard"
import VideoGallery from "@/components/learn/VideoGallery"
import { ARTICLES, LEARNING_GUIDES } from "@/content/learn/articles"
import type { PeptideProfile } from "@/content/learn/peptides"
import { getProfileVideoResources } from "@/content/learn/video-resources"
import type { VideoConnection } from "@/content/learn/videos"

function Group({ id, title, link, children }: { id: string; title: string; link?: { href: string; label: string }; children: React.ReactNode }) {
  const ct = useContentTranslator()
  return (
    <Box component="section" aria-labelledby={id} sx={{ mt: { xs: 5, md: 6 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", columnGap: 3, rowGap: 0.5, mb: 2.5 }}>
        <Typography id={id} component="h3" sx={{ fontSize: { xs: 20, md: 22 }, fontWeight: 600, letterSpacing: "-.02em" }}>{ct(title)}</Typography>
        {link ? <AppLink href={link.href} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, minHeight: 44, fontSize: 14, fontWeight: 600 }}>{ct(link.label)} <Icon name="arrowRight" sx={{ fontSize: 16 }} /></AppLink> : null}
      </Box>
      {children}
    </Box>
  )
}

/**
 * The end of every product page: the library guides, news and videos about the compound (or each
 * compound of a blend). Products the library doesn't cover get the guides to reading research.
 */
export default function ProductLearnMore({ title, guides }: { title: string; guides: PeptideProfile[] }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const slugs = guides.map((guide) => guide.slug)
  const articles = ARTICLES.filter((article) => !LEARNING_GUIDES.includes(article) && article.peptides.some((slug) => slugs.includes(slug))).slice(0, 3)
  const readingGuides = articles.length ? [] : LEARNING_GUIDES.slice(0, 2)

  // Videos about the compound itself first, then related background, three at most.
  const selections = guides.map((guide) => getProfileVideoResources(guide))
  const videos = [...selections.flatMap((selection) => selection.specific), ...selections.flatMap((selection) => selection.background)]
    .filter((video, index, all) => all.findIndex((other) => other.id === video.id) === index)
    .slice(0, 3)
  const connections: Record<string, VideoConnection> = Object.assign({}, ...selections.map((selection) => selection.connections))

  return (
    <Section tone="white" aria-labelledby="product-learn-title" sx={{ borderTop: "1px solid", borderColor: "divider" }}>
      <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue" }}>{ct("Learn")}</Typography>
      <Typography component="h2" variant="h3" id="product-learn-title" sx={{ mt: 1 }}>{ct.rich("Read and watch: {v0}", { v0: ct(title) }, {  })}</Typography>
      <Typography sx={{ mt: 1.5, maxWidth: 740, color: "text.secondary", lineHeight: 1.8 }}>
        {ct("Plain-language guides, news about new studies and selected videos from doctors and researchers. Published studies are about the named compound; they don't establish the safety or performance of this research product.")}
      </Typography>

      {guides.length ? (
        <Group id="product-guides-title" title={ct(guides.length > 1 ? act("compoundGuides") : act("theGuide"))} link={{ href: "/learn", label: "All peptide guides" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: 3 }}>
            {guides.slice(0, 4).map((guide) => <PeptideCard key={guide.slug} peptide={guide} />)}
          </Box>
        </Group>
      ) : null}

      {articles.length || readingGuides.length ? (
        <Group id="product-news-title" title={ct(articles.length ? act("inNews") : act("readingResearch"))} link={{ href: "/news", label: "All news" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 4 }}>
            {(articles.length ? articles : readingGuides).map((article) => <ArticleCard key={article.slug} article={article} />)}
          </Box>
        </Group>
      ) : null}

      {videos.length ? (
        <Group id="product-videos-title" title={act("videos")} link={{ href: "/videos", label: "All videos" }}>
          <VideoGallery videos={videos} connections={connections} columns={videos.length <= 2 ? 2 : 3} />
        </Group>
      ) : null}
    </Section>
  )
}
