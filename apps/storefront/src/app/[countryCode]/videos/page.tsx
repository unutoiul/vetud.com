import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import PageHeader from "@/components/common/PageHeader"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import VideoGallery from "@/components/learn/VideoGallery"
import { VIDEO_TOPICS, VIDEOS } from "@/content/learn/videos"
import { collectionMetadata } from "@/lib/article-seo"
import { gutter } from "@/theme/tokens"

export const metadata = collectionMetadata({
  path: "/videos",
  title: "Peptide videos, biology and research education",
  description: `${VIDEOS.length} selected YouTube videos about peptides, hormones, medicines and reading research, from clinicians, universities, hospitals and science educators.`,
})

export default function VideosPage() {
  return (
    <>
      <PageHeader eyebrow="Videos" title="Peptides and science, explained." description={`${VIDEOS.length} selected videos, grouped by topic. Learn the biology, hear clinical and research discussions, and practise reading the evidence. Each profile and article has a connected selection. Opening a video loads it from YouTube.`} />
      {/* Same column and gutters as the header and sections, so the topics line up with the page. */}
      <Box component="nav" aria-label="Video topics" sx={{ px: gutter, py: { xs: 2.5, md: 3.5 }, bgcolor: "brand.paper", borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ maxWidth: 1360, mx: "auto" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 650, color: "text.secondary", mb: 1.5 }}>Topics</Typography>
          {/* Phones: one row that scrolls sideways and runs to the screen edges. Wider: wraps. */}
          <Box sx={{ display: "flex", flexWrap: { xs: "nowrap", md: "wrap" }, gap: 1, overflowX: { xs: "auto", md: "visible" }, mx: { xs: -2.5, sm: -4, md: 0 }, px: { xs: 2.5, sm: 4, md: 0 }, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            {VIDEO_TOPICS.map((topic) => (
              <AppLink key={topic.id} href={`#videos-${topic.id}`} sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, flexShrink: 0, whiteSpace: "nowrap", minHeight: 44, px: 2, borderRadius: 999, border: "1px solid", borderColor: "divider", bgcolor: "#fff", color: "text.primary", textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "border-color .15s ease, color .15s ease", "&:hover": { borderColor: "brand.blue", color: "brand.blue" } }}>
                {topic.name}
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{VIDEOS.filter((video) => video.topic === topic.id).length}</Box>
              </AppLink>
            ))}
          </Box>
        </Box>
      </Box>
      {VIDEO_TOPICS.map((topic, index) => {
        const videos = VIDEOS.filter((video) => video.topic === topic.id)
        if (!videos.length) return null
        return (
          <Section key={topic.id} id={`videos-${topic.id}`} tone={index % 2 ? "paper" : "white"} aria-labelledby={`videos-title-${topic.id}`} sx={{ py: { xs: 5, md: 7 }, scrollMarginTop: 110 }}>
            <Box sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography id={`videos-title-${topic.id}`} component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 600, letterSpacing: "-.03em" }}>{topic.name}</Typography>
            </Box>
            <VideoGallery videos={videos} />
          </Section>
        )
      })}
    </>
  )
}
