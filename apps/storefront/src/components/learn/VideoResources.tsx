import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { AppLink } from "@/components/common/links"
import type { LearnVideo, VideoConnection } from "@/content/learn/videos"
import VideoGallery from "./VideoGallery"

export default function VideoResources({ videos, background = false, introduction, connections, currentArticle }: { videos: LearnVideo[]; background?: boolean; introduction?: string; connections?: Record<string, VideoConnection>; currentArticle?: string }) {
  return (
    <Box>
      <Typography sx={{ mb: 2.5, color: "brand.navySoft", fontSize: 16, lineHeight: 1.8, maxWidth: 820 }}>
        {introduction ?? (background
          ? "These videos explain related biology and how to assess the evidence. They do not test the specific compound or formulation discussed in this article."
          : "Selected educational videos and official recordings. Videos provide context; the original studies and regulatory documents below support this profile. Older recordings may not include later findings.")}
      </Typography>
      <VideoGallery videos={videos} connections={connections} columns={videos.length <= 2 ? 2 : 3} />
      <Box component="nav" aria-label="Research learning guides" sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: .5 }}>
        {[
          { slug: "from-cells-to-human-trials", label: "Learn how research moves from cells to people" },
          { slug: "body-weight-fat-and-muscle-results", label: "Learn to read weight, fat and muscle results" },
        ].filter(guide => guide.slug !== currentArticle).map(guide => <AppLink key={guide.slug} href={`/news/${guide.slug}`} sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 600 }}>{guide.label} →</AppLink>)}
      </Box>
    </Box>
  )
}
