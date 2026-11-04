"use client"

import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import { useEffect, useRef, useState } from "react"
import Icon from "@/components/brand/Icon"

export type HeroVideoSource = { src: string; poster: string }

/**
 * A muted, looping, decorative video for a page hero. It starts once the page is interactive,
 * stays on its poster for visitors who prefer reduced motion, and always has a pause button.
 * Below md it is a band under the hero text; from md it fills the hero behind the text.
 */
export default function HeroVideo({ src, poster }: HeroVideoSource) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const element = video.current
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    element.muted = true
    element.play().catch(() => {})
  }, [])

  return <Box sx={{ position: { xs: "relative", md: "absolute" }, inset: { md: 0 }, aspectRatio: { xs: "12 / 5", sm: "3 / 1", md: "auto" }, overflow: "hidden" }}>
    <Box component="video" ref={video} muted loop playsInline preload="metadata" poster={poster} aria-hidden tabIndex={-1}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
      sx={{
        position: "absolute", display: "block", maxWidth: "none",
        // Small screens crop to the subject on the right; wider ones keep the whole height and
        // let the video's own pale left side run under the text.
        inset: { xs: 0, md: "0 0 0 auto" }, width: { xs: "100%", md: "auto" }, height: "100%", aspectRatio: { md: "1920 / 500" },
        objectFit: "cover", objectPosition: "right center",
      }}>
      <source src={src} type="video/mp4" />
    </Box>
    <IconButton onClick={() => (playing ? video.current?.pause() : video.current?.play())} aria-label={playing ? "Pause the background video" : "Play the background video"}
      sx={{ position: "absolute", zIndex: 2, right: { xs: 12, md: 20 }, bottom: { xs: 12, md: 20 }, width: 36, height: 36, color: "brand.navy", bgcolor: "rgba(255,255,255,.82)", border: "1px solid", borderColor: "divider", "&:hover": { bgcolor: "#fff" } }}>
      <Icon name={playing ? "pause" : "play"} sx={{ fontSize: 16 }} />
    </IconButton>
  </Box>
}
