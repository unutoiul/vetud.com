"use client"

import Box from "@mui/material/Box"
import Dialog from "@mui/material/Dialog"
import IconButton from "@mui/material/IconButton"
import Link from "@mui/material/Link"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useState } from "react"
import { thumbnailUrl, watchUrl, type LearnVideo } from "@/content/learn/videos"
import Icon from "../brand/Icon"

/** Video cards that play in a dialog. Nothing loads from YouTube until a video is opened. */
export default function VideoGallery({ videos, columns = 3 }: { videos: LearnVideo[]; columns?: 2 | 3 }) {
  const [playing, setPlaying] = useState<LearnVideo | null>(null)
  return <>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: `repeat(${columns}, 1fr)` }, gap: { xs: 3.5, md: 4 } }}>
      {videos.map((video) => (
        <Box component="article" key={video.id}>
          <Box component="button" type="button" onClick={() => setPlaying(video)} aria-label={`Play “${video.title}” by ${video.creator}`} sx={{ display: "block", position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", p: 0, border: 0, borderRadius: "6px", bgcolor: "brand.navyDeep", cursor: "pointer", "&:focus-visible": { outline: "3px solid", outlineColor: "brand.blue", outlineOffset: 3 }, "&:hover .video-play": { transform: "scale(1.08)", bgcolor: "brand.blue" }, "@media (prefers-reduced-motion: reduce)": { "& .video-play": { transition: "none" }, "&:hover .video-play": { transform: "none" } } }}>
            <Image src={thumbnailUrl(video.id)} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" style={{ objectFit: "cover" }} loading="lazy" />
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, rgba(5,9,26,.55), transparent 55%)" }} />
            <Box className="video-play" sx={{ position: "absolute", top: "50%", left: "50%", translate: "-50% -50%", width: 58, height: 58, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "brand.navy", color: "#fff", border: "1px solid rgba(255,255,255,.4)", transition: "transform 250ms ease, background-color 250ms ease" }}><Icon name="play" sx={{ fontSize: 26, ml: .5 }} /></Box>
          </Box>
          <Typography sx={{ mt: 1.75, fontSize: 12.5, color: "brand.blue", fontWeight: 650 }}>{video.creator}</Typography>
          <Typography component="h3" sx={{ mt: .5, fontSize: 18, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-.02em" }}>{video.title}</Typography>
          <Typography sx={{ mt: .75, fontSize: 14, color: "text.secondary", lineHeight: 1.6 }}>{video.summary}</Typography>
          <Typography sx={{ mt: .75, fontSize: 12.5, color: "text.secondary" }}>{video.credential}</Typography>
        </Box>
      ))}
    </Box>
    <Dialog open={Boolean(playing)} onClose={() => setPlaying(null)} fullWidth maxWidth="lg" aria-labelledby="learn-video-title" slotProps={{ paper: { sx: { overflow: "hidden", bgcolor: "brand.navyDeep", color: "#fff", borderRadius: 3 } } }}>
      <Stack direction="row" sx={{ px: { xs: 2, md: 3 }, py: 1.5, alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Typography id="learn-video-title" component="h2" sx={{ fontSize: { xs: 15, md: 18 }, fontWeight: 500 }}>{playing?.title}</Typography>
        <IconButton aria-label="Close video" onClick={() => setPlaying(null)} sx={{ color: "#fff" }}><Icon name="close" /></IconButton>
      </Stack>
      {playing && <Box sx={{ position: "relative", aspectRatio: "16 / 9", minHeight: 200 }}><Box component="iframe" src={`https://www.youtube-nocookie.com/embed/${playing.id}?autoplay=1&rel=0&playsinline=1`} title={playing.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} /></Box>}
      <Box sx={{ px: 3, py: 2 }}><Link href={playing ? watchUrl(playing.id) : "#"} target="_blank" rel="noopener noreferrer" sx={{ color: "#fff", fontSize: 13 }}>Watch on YouTube</Link></Box>
    </Dialog>
  </>
}
