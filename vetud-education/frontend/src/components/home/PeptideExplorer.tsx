"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import Image from "next/image"
import { useFormatter, useTranslations } from "next-intl"
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react"
import * as m from "motion/react-m"
import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import Link from "@mui/material/Link"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import { AppLink, ButtonLink } from "../common/links"
import { brand } from "@/theme/tokens"

export type FeaturedGuide = {
  peptide: string
  name: string
  study: string
  change: number
  placebo: number
  source: string
  cover: string
  topic: string
  deck: string
  result: string
}

// The hero's own night palette, around the illustrations.
const PAPER = brand.stone50
const MUTED = brand.slate225
const ACCENT = brand.teal225
const focusRing = { outline: `2px solid ${brand.white}`, outlineOffset: "3px" }

type HeroFilm = { poster: string; large: string; small: string }

/**
 * Guides whose picture is a silent looping film (owner, 2026-11-27: "Slow Orbit" for Tirzepatide,
 * the guide shown first). The poster is the film's first frame, so the switch from picture to film
 * can't be seen. Source: assets/VETUD Ribbon Loop/Slow Orbit, compressed to 1200 and 720 px wide.
 */
const HERO_FILMS: Partial<Record<string, HeroFilm>> = {
  tirzepatide: {
    poster: "/images/learn/spotlights/tirzepatide-orbit.webp",
    large: "/media/hero/tirzepatide-orbit-1200.mp4",
    small: "/media/hero/tirzepatide-orbit-720.mp4",
  },
}

/**
 * The film over its poster. It loads only after the page has finished loading (so the poster stays
 * the first thing painted), fades in once it plays, pauses while off screen, and is skipped for
 * reduced motion (by the caller) and for data saver.
 */
function HeroFilmPlayer({ film }: { film: HeroFilm }) {
  const [src, setSrc] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return
    let timer: number | undefined
    const start = () => { timer = window.setTimeout(() => setSrc(window.matchMedia("(min-width: 600px)").matches ? film.large : film.small), 200) }
    if (document.readyState === "complete") start()
    else window.addEventListener("load", start, { once: true })
    return () => {
      window.removeEventListener("load", start)
      window.clearTimeout(timer)
    }
  }, [film])

  useEffect(() => {
    const element = video.current
    if (!src || !element) return
    // Muted must be set on the element itself for phones to allow autoplay.
    element.muted = true
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void element.play().catch(() => undefined)
      else element.pause()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [src])

  if (!src) return null
  return <Box component="video" ref={video} src={src} muted loop playsInline preload="auto" disablePictureInPicture aria-hidden tabIndex={-1}
    onPlaying={() => setPlaying(true)}
    sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: playing ? 1 : 0, transition: "opacity .6s ease" }} />
}

/**
 * The featured guides: one large at a time, and every guide visible below it as a tab, so there's
 * nothing to scroll sideways (owner request 2026-11-18). Phones can also swipe the picture.
 */
export default function PeptideExplorer({ guides }: { guides: FeaturedGuide[] }) {
  const [index, setIndex] = useState(0)
  const [hasSwitched, setHasSwitched] = useState(false)
  const reduceMotion = useReducedMotion()
  const t = useTranslations("LearnHero")
  const format = useFormatter()
  const titleId = useId()
  const resultId = useId()
  const picker = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ id: number; x: number; y: number } | null>(null)
  const guide = guides[index]
  const film = HERO_FILMS[guide.peptide]
  const percent = (value: number) => format.number(value / 100, {
    style: "percent", signDisplay: "always", minimumFractionDigits: 1, maximumFractionDigits: 1,
  }).replace("-", "−")
  const animateSelection = hasSwitched && !reduceMotion

  function select(position: number, focus = false) {
    const next = (position + guides.length) % guides.length
    if (next !== index) {
      setHasSwitched(true)
      setIndex(next)
    }
    if (focus) (picker.current?.children[next] as HTMLElement | undefined)?.focus()
  }

  function onPickerKey(event: KeyboardEvent<HTMLDivElement>) {
    const targets: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: guides.length - 1 }
    if (event.key in targets) {
      event.preventDefault()
      select(targets[event.key], true)
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <Box component="section" aria-label={t("featuredGuides")}
        sx={{ color: PAPER, background: `radial-gradient(ellipse at 72% 38%, ${brand.blue875} 0, ${brand.blue925} 52%, ${brand.blue925_2} 82%)`, overflow: "hidden" }}>
        <Box sx={{
          maxWidth: 1520, mx: "auto",
          px: { xs: "max(18px, 5vw)", md: "clamp(24px, 5vw, 80px)" },
          pt: { xs: "24px", md: "clamp(32px, 4vw, 60px)" },
          pb: { xs: "24px", md: "clamp(24px, 2.6vw, 40px)" },
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "47% 53%" },
          gridTemplateAreas: { xs: '"header" "art" "copy" "picker"', md: '"header art" "copy art" "picker picker"' },
        }}>
          <Box component="header" sx={{ gridArea: "header", alignSelf: "end", position: "relative", zIndex: 1 }}>
            <Typography sx={{ display: "flex", gap: 1.5, alignItems: "center", m: 0, mb: { xs: 1, md: "clamp(12px, 1.4vw, 20px)" }, color: ACCENT, fontSize: { xs: 10, md: 12 }, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>
              <Box component="span" aria-hidden sx={{ height: 2, width: 32, bgcolor: "currentColor" }} />{t("series")}
            </Typography>
            <m.h1 key={guide.peptide} id={titleId} style={{ margin: 0 }}
              initial={animateSelection ? { opacity: 0.4, y: 9 } : false}
              animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}>
              <Typography component="span" variant="inherit" sx={{ display: "block", font: "inherit", fontSize: { xs: "clamp(42px, 11vw, 68px)", md: "clamp(52px, 6.4vw, 96px)" }, fontWeight: 500, lineHeight: 1.06, letterSpacing: "-.068em" }}>
                {guide.name}
              </Typography>
            </m.h1>
          </Box>

          <Box aria-hidden
            onPointerDown={event => {
              if (event.pointerType !== "touch" || !event.isPrimary) return
              touchStart.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerCancel={() => { touchStart.current = null }}
            onPointerUp={event => {
              const start = touchStart.current
              touchStart.current = null
              if (!start || event.pointerId !== start.id) return
              const dx = event.clientX - start.x
              if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.4) select(index + (dx < 0 ? 1 : -1))
            }}
            sx={{
              gridArea: "art", position: "relative", alignSelf: "stretch", touchAction: "pan-y pinch-zoom", mixBlendMode: "lighten",
              height: { xs: "clamp(155px, 40vw, 250px)", md: "auto" },
              minHeight: { md: "clamp(300px, 30vw, 460px)" },
              m: { xs: "2px -5vw 0", md: "-36px -4vw -12px -1vw" },
              maskImage: {
                xs: "radial-gradient(ellipse 58% 72% at center, black 50%, transparent 95%)",
                md: "linear-gradient(to right, transparent, black 13%, black 92%, transparent), linear-gradient(to bottom, transparent, black 12%, black 87%, transparent)",
              },
              maskComposite: { md: "intersect" },
            }}>
            <m.div key={guide.peptide} style={{ position: "absolute", inset: 0 }}
              initial={animateSelection ? { scale: 1.07, rotate: -2, opacity: 0.45 } : reduceMotion || hasSwitched ? false : { y: 10, scale: 0.94, rotate: -3 }}
              animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
              transition={{ duration: hasSwitched ? 0.8 : 1.6, ease: hasSwitched ? [0.22, 1, 0.36, 1] : [0.2, 0.75, 0.22, 1] }}>
              <Image src={film?.poster ?? `/images/learn/spotlights/${guide.peptide}.webp`} alt="" fill
                sizes="(min-width: 1480px) 810px, (min-width: 900px) 56vw, 100vw"
                // The first guide's picture is the page's largest paint (LCP): preloaded, fetched first
                // and never lazy-loaded. Pictures of guides picked later load at once too.
                preload={!hasSwitched} loading="eager" fetchPriority={hasSwitched ? undefined : "high"} style={{ objectFit: "contain" }} />
              {film && !reduceMotion ? <HeroFilmPlayer film={film} /> : null}
            </m.div>
          </Box>

          <Box id={resultId} aria-live="polite" aria-atomic="true" sx={{ gridArea: "copy", position: "relative", zIndex: 1, alignSelf: "start" }}>
            <Typography sx={{ maxWidth: "35em", mt: { xs: 1.25, md: "clamp(12px, 1.4vw, 20px)" }, color: brand.slate125, fontSize: { xs: 16, md: "clamp(17px, 1.4vw, 21px)" }, lineHeight: 1.48, textWrap: "pretty" }}>
              {guide.deck}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.75, md: "clamp(14px, 1.4vw, 22px)" }, my: { xs: 2, md: "clamp(18px, 2vw, 28px)" } }}>
              <Typography component="strong" sx={{ color: ACCENT, fontSize: { xs: "clamp(34px, 8.2vw, 46px)", md: "clamp(40px, 3.8vw, 58px)" }, letterSpacing: "-.06em", lineHeight: 1, fontWeight: 500, whiteSpace: "nowrap" }}>
                {percent(guide.change)}
              </Typography>
              <Box sx={{ pl: { xs: 1.5, md: "clamp(12px, 1.3vw, 18px)" }, borderLeft: `1px solid ${brand.slate625}` }}>
                <Typography sx={{ m: 0, mb: "3px", fontSize: { xs: 13, md: 14 }, lineHeight: 1.35, maxWidth: "27em" }}>{guide.result}</Typography>
                <Link href={guide.source} target="_blank" rel="noopener noreferrer" underline="always"
                  sx={{ fontSize: 12, lineHeight: 1.5, color: MUTED, fontWeight: 400, textUnderlineOffset: "3px", whiteSpace: "nowrap", "&:focus-visible": focusRing }}>
                  {guide.study}<Icon name="arrowUpRight" sx={{ fontSize: 12, ml: "2px", verticalAlign: "-1px" }} />
                </Link>
                <Typography component="span" sx={{ display: "inline-block", ml: 1, fontSize: 12, lineHeight: 1.5, color: MUTED }}>
                  {t("placeboChange", { change: percent(guide.placebo) })}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: { xs: 2, md: "clamp(16px, 1.8vw, 26px)" }, alignItems: "center", flexWrap: "wrap" }}>
              <ButtonLink href={`/learn/${guide.peptide}`} aria-label={t("readNamedGuide", { name: guide.name })} endIcon={<Icon name="arrowRight" />}
                sx={{ minHeight: 46, px: "21px", borderRadius: "28px", bgcolor: ACCENT, color: brand.teal875, fontSize: 14, fontWeight: 600, boxShadow: "none", "&:hover": { bgcolor: brand.teal125, boxShadow: "none" }, "&.Mui-focusVisible": focusRing }}>
                {t("openGuide")}
              </ButtonLink>
              <AppLink href="/learn" underline="always"
                sx={{ minHeight: 46, display: "inline-flex", alignItems: "center", color: PAPER, fontSize: 14, fontWeight: 600, textUnderlineOffset: "5px", "&:focus-visible": focusRing }}>
                {t("allGuides")}
              </AppLink>
            </Box>
          </Box>

          {/* Every guide at once: a wrapping grid, never a sideways scroll. */}
          <Box ref={picker} role="group" aria-label={t("featured")} onKeyDown={onPickerKey}
            sx={{ gridArea: "picker", mt: { xs: 2.5, md: "clamp(22px, 2.4vw, 34px)" }, display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 1, md: 1.25 } }}>
            {guides.map((item, i) => (
              <ButtonBase key={item.peptide} aria-pressed={index === i} tabIndex={index === i ? 0 : -1}
                aria-controls={`${titleId} ${resultId}`} onClick={() => select(i)}
                sx={{
                  justifyContent: "flex-start", gap: { xs: 1, md: 1.5 }, minWidth: 0, minHeight: { xs: 48, md: 64 }, p: { xs: "5px 7px", md: "8px" },
                  border: `1px solid ${brand.slate725}`, borderRadius: "10px", bgcolor: brand.blue875_2, color: PAPER, textAlign: "left", font: "inherit",
                  transition: "background-color .2s ease, border-color .2s ease",
                  "&:hover": { bgcolor: brand.blue850 },
                  '&[aria-pressed="true"]': { borderColor: ACCENT, bgcolor: brand.teal850 },
                  "&.Mui-focusVisible": { outline: `2px solid ${brand.white}`, outlineOffset: "-4px" },
                }}>
                <Box component="span" sx={{ position: "relative", width: { xs: 30, md: 52 }, aspectRatio: "1.12", overflow: "hidden", borderRadius: "5px", flexShrink: 0 }}>
                  <Image src={item.cover} alt="" fill sizes="56px" style={{ objectFit: "cover", objectPosition: "74% center" }} />
                </Box>
                <Box component="span" sx={{ display: "grid", gap: "2px", minWidth: 0 }}>
                  <Typography component="strong" sx={{ fontSize: { xs: 14, md: 17 }, lineHeight: 1.2, fontWeight: 600, letterSpacing: "-.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</Typography>
                  <Typography component="small" sx={{ color: MUTED, fontSize: { xs: 11, md: 12 }, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.topic}</Typography>
                </Box>
              </ButtonBase>
            ))}
          </Box>
        </Box>
      </Box>
    </LazyMotion>
  )
}
