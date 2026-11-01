import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import PageHeader from "@/components/common/PageHeader"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import VideoGallery from "@/components/learn/VideoGallery"
import { VIDEO_TOPICS, VIDEOS } from "@/content/learn/videos"

export const metadata: Metadata = {
  title: "Peptide videos, biology and research education",
  description: `${VIDEOS.length} selected YouTube videos about peptides, hormones, medicines and reading research, from clinicians, universities, hospitals and science educators.`,
}

export default function VideosPage() {
  return (
    <>
      <PageHeader eyebrow="Videos" title="Peptides and science, explained." description={`${VIDEOS.length} selected videos, grouped by topic. Learn the biology, hear clinical and research discussions, and practise reading the evidence. Each profile and article has a connected selection. Opening a video loads it from YouTube.`} />
      <Box component="nav" aria-label="Video topics" sx={{ px: { xs: 2.5, sm: 4, md: 6, lg: 8 }, py: 3, display: "flex", flexWrap: "wrap", gap: 1.25, borderBottom: "1px solid", borderColor: "divider" }}>
        {VIDEO_TOPICS.map(topic => <AppLink key={topic.id} href={`#videos-${topic.id}`} sx={{ minHeight: 44, display: "inline-flex", alignItems: "center", px: 1.5, border: "1px solid", borderColor: "divider", borderRadius: "6px", fontSize: 13.5, fontWeight: 600 }}>{topic.name} ({VIDEOS.filter(video => video.topic === topic.id).length})</AppLink>)}
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
