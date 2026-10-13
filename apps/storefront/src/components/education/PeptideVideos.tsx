"use client"

import Image from "next/image"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { PEPTIDE_VIDEOS, PEPTIDE_VIDEO_CHANNEL } from "@/content/peptide-videos"
import Icon from "../brand/Icon"
import { AppLink, ButtonLink } from "../common/links"
import Section from "../common/Section"

export default function PeptideVideos() {
  const [playing, setPlaying] = useState<string | null>(null)
  const active = PEPTIDE_VIDEOS.find((video) => video.id === playing)
  return <>
    <Section id="peptide-videos" tone="paper" aria-labelledby="peptide-videos-title" sx={{ py: { xs: 6, md: 9 } }}>
      <Stack direction={{ xs: "column", md: "row" }} sx={{ justifyContent: "space-between", alignItems: { md: "flex-end" }, gap: 3, mb: { xs: 4, md: 5 } }}>
        <Box><Typography variant="eyebrow" sx={{ color: "brand.blue", fontSize: 10.5, letterSpacing: ".12em", textTransform: "uppercase" }}>Watch & discover</Typography><Typography id="peptide-videos-title" component="h2" variant="h2" sx={{ mt: 2 }}>What are peptides?</Typography><Typography sx={{ color: "text.secondary", mt: 2, maxWidth: 620 }}>Start with amino acids, then see how they connect. Watch two introductions from Khan Academy.</Typography></Box>
        <ButtonLink href="/shop" variant="outlined" endIcon={<Icon name="arrowUpRight" />} sx={{ flexShrink: 0 }}>Explore the collection</ButtonLink>
      </Stack>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 4.5 } }}>
        {PEPTIDE_VIDEOS.map((video, index) => <Box component="article" key={video.id}>
          <Box component="button" type="button" onClick={() => setPlaying(video.id)} aria-label={`Play ${video.title} by ${video.creator}`} sx={{ display: "block", position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden", p: 0, border: 0, borderRadius: "24px 24px 24px 4px", bgcolor: "brand.navyDeep", cursor: "pointer", "&:focus-visible": { outline: "3px solid", outlineColor: "brand.blue", outlineOffset: 4 }, "&:hover .video-play": { transform: "scale(1.08)", bgcolor: "brand.blue" }, "@media (prefers-reduced-motion: reduce)": { "& .video-play": { transition: "none" }, "&:hover .video-play": { transform: "none" } } }}>
            <Image src={video.thumbnail} alt="" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover", opacity: .82 }} />
            <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(0deg, #0b263baa, transparent 50%)" }} />
            <Box className="video-play" sx={{ position: "absolute", top: "50%", left: "50%", translate: "-50% -50%", width: { xs: 58, md: 72 }, height: { xs: 58, md: 72 }, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "brand.navy", color: "#fff", border: "1px solid #ffffff66", transition: "transform 250ms ease, background-color 250ms ease" }}><Icon name="play" sx={{ fontSize: 28, ml: .5 }} /></Box>
            <Typography component="span" sx={{ position: "absolute", bottom: 18, left: 20, color: "#fff", fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase" }}>{video.creator} / YouTube</Typography>
          </Box>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2, mt: 2.5 }}>
            <Box><Typography sx={{ fontSize: 10, color: "text.secondary", mb: .75, letterSpacing: ".1em" }}>0{index + 1} / THE BASICS</Typography><Typography component="h3" sx={{ fontSize: { xs: 23, md: 27 }, lineHeight: 1.25, letterSpacing: "-.035em", fontWeight: 500 }}>{video.title}</Typography><Typography sx={{ color: "text.secondary", fontSize: 13, mt: 1, maxWidth: 460 }}>{video.summary}</Typography></Box>
            <AppLink href={video.watchUrl} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${video.title} on YouTube`} sx={{ display: "grid", placeItems: "center", width: 44, height: 44, flexShrink: 0, border: "1px solid", borderColor: "divider", borderRadius: "50%", color: "brand.navy" }}><Icon name="youtube" sx={{ fontSize: 21 }} /></AppLink>
          </Stack>
        </Box>)}
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ mt: { xs: 4, md: 5 }, pt: 3, borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", alignItems: { sm: "center" }, gap: 2 }}>
        <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>Independent educational videos by Khan Academy.</Typography>
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 2 }}><ButtonLink href="/education" variant="text" endIcon={<Icon name="arrowRight" />}>Keep learning</ButtonLink><Button component="a" href={PEPTIDE_VIDEO_CHANNEL} target="_blank" rel="noopener noreferrer" variant="text" startIcon={<Icon name="youtube" />}>More on YouTube</Button></Stack>
      </Stack>
    </Section>
    <Dialog open={Boolean(active)} onClose={() => setPlaying(null)} fullWidth maxWidth="lg" aria-labelledby="video-dialog-title" slotProps={{ paper: { sx: { overflow: "hidden", bgcolor: "brand.navyDeep", color: "#fff", borderRadius: 3 } } }}>
      <Stack direction="row" sx={{ px: { xs: 2, md: 3 }, py: 1.5, alignItems: "center", justifyContent: "space-between", gap: 2 }}><Typography id="video-dialog-title" component="h2" sx={{ fontSize: { xs: 15, md: 18 }, fontWeight: 500 }}>{active?.title}</Typography><IconButton aria-label="Close video" onClick={() => setPlaying(null)} sx={{ color: "#fff", width: 44, height: 44 }}><Icon name="close" /></IconButton></Stack>
      {active && <Box sx={{ position: "relative", aspectRatio: "16 / 9", minHeight: 200 }}><Box component="iframe" src={`https://www.youtube-nocookie.com/embed/${active.id}?autoplay=1&rel=0&playsinline=1`} title={active.youtubeTitle} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }} /></Box>}
      <Box sx={{ px: 3, py: 2 }}><AppLink href={active?.watchUrl ?? PEPTIDE_VIDEO_CHANNEL} target="_blank" rel="noopener noreferrer" sx={{ color: "#fff", fontSize: 12 }}>Open this video on YouTube</AppLink></Box>
    </Dialog>
  </>
}
