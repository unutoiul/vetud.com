"use client"

import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import { alpha, type SxProps, type Theme } from "@mui/material/styles"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { BOOK } from "./book"

/**
 * Whether this browser can show the moving cover. It's a WebM with a transparent background, which
 * Safari (and every iPhone browser) draws on black, so they keep the still cover; so do visitors who
 * ask for less motion or less data.
 */
function canPlayFilm() {
  const ua = navigator.userAgent
  const webkitOnly = /iP(hone|ad|od)/.test(ua) || (/Safari\//.test(ua) && !/(Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS)\//.test(ua))
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
  return !webkitOnly && !reduceMotion && !saveData && document.createElement("video").canPlayType('video/webm; codecs="vp9"') !== ""
}

/**
 * The Peptides Explained book, standing on a soft glow. The still cover shows first; where the browser
 * can, the animated cover (ribbons moving) fades in over it. Size it with `sx` (maxWidth).
 */
export default function BookCover({ alt, sizes, priority, controlMotion = false, sx }: { alt: string; sizes: string; priority?: boolean; controlMotion?: boolean; sx?: SxProps<Theme> }) {
  const ct = useContentTranslator()
  const [film, setFilm] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [requested, setRequested] = useState(false)
  const showFilm = film && (!controlMotion || requested)
  const motionLabel = requested ? ct("Stop cover animation") : ct("Play cover animation")

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setFilm(canPlayFilm()))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return <><Box sx={[{
    position: "relative",
    width: "100%",
    mx: "auto",
    aspectRatio: "2 / 3",
    // A cyan glow behind the book, like the light on its cover.
    "&::before": {
      content: '""',
      position: "absolute",
      inset: "12% 4% 6%",
      borderRadius: "50%",
      background: `radial-gradient(closest-side, ${alpha(brand.cyan, .28)}, transparent)`,
      filter: "blur(18px)",
    },
    "& img, & video": { filter: `drop-shadow(0 24px 30px ${alpha(brand.navyDeep, .6)})` },
  }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Image src={BOOK.cover} alt={alt} fill preload={priority} sizes={sizes} style={{ objectFit: "contain", opacity: showFilm && playing ? 0 : 1, transition: "opacity .4s ease" }} />
    {showFilm ? <Box
      component="video"
      src={BOOK.film}
      autoPlay
      muted
      loop
      playsInline
      disablePictureInPicture
      disableRemotePlayback
      preload="auto"
      aria-hidden
      // React doesn't always set the muted property, and browsers only autoplay muted video.
      ref={(element: HTMLVideoElement | null) => { if (element) element.muted = true }}
      onPlaying={() => setPlaying(true)}
      onError={() => setFilm(false)}
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", opacity: playing ? 1 : 0, transition: "opacity .4s ease" }}
    /> : null}
  </Box>
    {controlMotion && film && <IconButton aria-label={motionLabel} title={motionLabel}
      onClick={() => { setPlaying(false); setRequested(!requested) }}
      sx={{ position: "absolute", right: 8, bottom: 8, color: "brand.navyDeep", bgcolor: "brand.whiteA80", border: 1, borderColor: "brand.slate125", "&:hover": { bgcolor: "white" } }}>
      <Icon name={requested ? "pause" : "play"} sx={{ fontSize: 18 }} />
    </IconButton>}
  </>
}
