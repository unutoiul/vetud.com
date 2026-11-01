import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import VideoGallery from "@/components/learn/VideoGallery"
import { VIDEO_TOPICS, VIDEOS } from "@/content/learn/videos"

export const metadata: Metadata = {
  title: "Videos: doctors explain peptides",
  description: "Hand-picked videos about peptides and the new weight-loss medicines, mostly from doctors, including skeptical ones.",
}

export default function VideosPage() {
  return (
    <>
      <PageHeader eyebrow="Videos" title="Doctors explain peptides." description="Hand-picked videos, mostly from doctors, including some skeptical ones. Opening a video loads it from YouTube." />
      {VIDEO_TOPICS.map((topic, index) => {
        const videos = VIDEOS.filter((video) => video.topic === topic.id)
        if (!videos.length) return null
        return (
          <Section key={topic.id} tone={index % 2 ? "paper" : "white"} aria-labelledby={`videos-${topic.id}`} sx={{ py: { xs: 5, md: 7 } }}>
            <Box sx={{ mb: { xs: 3, md: 4 } }}>
              <Typography id={`videos-${topic.id}`} component="h2" sx={{ fontSize: { xs: 26, md: 32 }, fontWeight: 600, letterSpacing: "-.03em" }}>{topic.name}</Typography>
            </Box>
            <VideoGallery videos={videos} />
          </Section>
        )
      })}
    </>
  )
}
