"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "motion/react"
import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"

const SLIDES = [
  {
    image: "/images/vetud-complete-collection-alpine.png",
    alt: "The complete VETUD Peptide Series: Retatrutide, Tirzepatide and Semaglutide pen kits with Selank and Semax sprays beside an alpine lake",
    title: "The complete collection",
    detail: "One collection. Two formats.",
    href: "/shop",
  },
  {
    image: "/images/vetud-pen-collection-alpine.png",
    alt: "VETUD Retatrutide, Semaglutide and Tirzepatide pen kits beside an alpine lake",
    title: "The pen collection",
    detail: "Three peptides. 10 mg / 20 mg / 40 mg.",
    href: "/shop",
  },
  {
    image: "/images/vetud-selank-landscape-01.png",
    alt: "VETUD Selank spray and box beside an alpine lake",
    title: "Selank",
    detail: "Peptide Series · 10 ml spray",
    href: "/products/selank",
  },
  {
    image: "/images/vetud-semax-landscape-01.png",
    alt: "VETUD Semax spray and box beside an alpine lake",
    title: "Semax",
    detail: "Peptide Series · 10 ml spray",
    href: "/products/semax",
  },
]

export default function HeroCarousel() {
  const [selected, setSelected] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const scene = useRef<HTMLDivElement>(null)
  const gesture = useRef<{ x: number; y: number } | null>(null)
  const visible = useInView(scene)
  const reduced = useReducedMotion()
  const rotating = visible && pageVisible && !reduced && !paused && !hovered

  useEffect(() => {
    const update = () => setPageVisible(!document.hidden)
    document.addEventListener("visibilitychange", update)
    update()
    return () => document.removeEventListener("visibilitychange", update)
  }, [])

  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => setSelected((current) => (current + 1) % SLIDES.length), 6500)
    return () => window.clearInterval(timer)
  }, [rotating, selected])

  const advance = (direction: number) => {
    setPaused(true)
    setSelected((current) => (current + direction + SLIDES.length) % SLIDES.length)
  }

  return (
    <Box
      ref={scene}
      role="region"
      aria-roledescription="carousel"
      aria-label="Peptide Series highlights"
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(true)
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault()
          advance(event.key === "ArrowLeft" ? -1 : 1)
        }
      }}
      sx={{ minWidth: 0, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 6, borderRadius: 3 } }}
    >
      <Box
        sx={{ position: "relative", aspectRatio: "4 / 3", borderRadius: { xs: 3, md: 4 }, overflow: "hidden", bgcolor: "#e1ecf1", touchAction: "pan-y", boxShadow: "0 24px 60px rgba(23,53,75,.09)" }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" || (event.target as Element).closest("button, a")) return
          gesture.current = { x: event.clientX, y: event.clientY }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerUp={(event) => {
          const start = gesture.current
          gesture.current = null
          if (!start) return
          const x = event.clientX - start.x
          const y = event.clientY - start.y
          if (Math.abs(x) > 45 && Math.abs(x) > Math.abs(y) * 1.3) advance(x < 0 ? 1 : -1)
        }}
        onPointerCancel={() => { gesture.current = null }}
      >
        <motion.div animate={{ x: `-${selected * 100}%` }} transition={{ duration: reduced ? 0 : .75, ease: [.22, 1, .36, 1] }} style={{ display: "flex", height: "100%" }}>
          {SLIDES.map((slide, index) => (
            <Box key={slide.image} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${SLIDES.length}: ${slide.title}`} aria-hidden={selected !== index} sx={{ flex: "0 0 100%", minWidth: 0, position: "relative", overflow: "hidden" }}>
              <Image src={slide.image} alt={slide.alt} fill sizes="(max-width: 900px) 100vw, 52vw" style={{ objectFit: "cover" }} preload={index === 0} loading={index === 0 ? undefined : "eager"} draggable={false} />
            </Box>
          ))}
        </motion.div>
        <Stack direction="row" sx={{ position: "absolute", inset: "50% 14px auto", justifyContent: "space-between", transform: "translateY(-50%)", pointerEvents: "none" }}>
          {([-1, 1] as const).map((direction) => <IconButton key={direction} aria-label={direction < 0 ? "Previous highlight" : "Next highlight"} onClick={() => advance(direction)} sx={{ width: { xs: 38, md: 44 }, height: { xs: 38, md: 44 }, pointerEvents: "auto", color: "brand.navy", bgcolor: "rgba(255,255,255,.88)", backdropFilter: "blur(10px)", border: "1px solid #ffffff80", boxShadow: "0 4px 18px rgba(23,53,75,.08)", "&:hover": { bgcolor: "white" } }}><Icon name="arrowRight" sx={{ fontSize: 19, transform: direction < 0 ? "rotate(180deg)" : "none" }} /></IconButton>)}
        </Stack>
      </Box>

      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2, mt: 2.75, px: .5 }}>
        <Box aria-live={rotating ? "off" : "polite"} aria-atomic="true">
          <Typography sx={{ fontSize: { xs: 18, md: 21 }, fontWeight: 600 }}>{SLIDES[selected].title}</Typography>
          <Typography sx={{ fontSize: { xs: 11.5, md: 13 }, color: "text.secondary", mt: .4 }}>{SLIDES[selected].detail}</Typography>
        </Box>
        <ButtonLink href={SLIDES[selected].href} variant="text" endIcon={<Icon name="arrowUpRight" />} sx={{ flexShrink: 0, minWidth: 0, px: 1, fontSize: 12 }}>Explore</ButtonLink>
      </Stack>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25, mt: 1.5, px: .5 }}>
        <Stack direction="row" spacing={.75} sx={{ alignItems: "center", flex: 1 }}>
          {SLIDES.map((slide, index) => <ButtonBase key={slide.image} aria-label={`Show ${slide.title}`} aria-pressed={selected === index} onClick={() => { setPaused(true); setSelected(index) }} sx={{ height: 40, width: selected === index ? 48 : 24, borderRadius: 2, transition: "width 300ms ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" }, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" } }}><Box component="span" sx={{ height: 3, width: "100%", borderRadius: 99, bgcolor: selected === index ? "brand.navy" : "#c7d7df" }} /></ButtonBase>)}
        </Stack>
        <Typography aria-hidden sx={{ fontSize: 10.5, letterSpacing: ".1em", color: "text.secondary" }}>{String(selected + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}</Typography>
        {!reduced && <IconButton onClick={() => setPaused(!paused)} aria-label={paused ? "Play highlight slideshow" : "Pause highlight slideshow"} sx={{ width: 36, height: 36, color: "brand.navySoft" }}><Box component="span" aria-hidden sx={{ fontSize: 14, fontWeight: 700 }}>{paused ? "▷" : "Ⅱ"}</Box></IconButton>}
      </Stack>
    </Box>
  )
}
