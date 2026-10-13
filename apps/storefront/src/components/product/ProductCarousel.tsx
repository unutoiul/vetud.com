"use client"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useRef, useState } from "react"
import Icon from "@/components/brand/Icon"

type ProductCarouselProps = {
  title: string
  images: { url: string; alt: string }[]
}

export default function ProductCarousel({ title, images }: ProductCarouselProps) {
  const [selected, setSelected] = useState(0)
  const gesture = useRef<{ x: number; y: number } | null>(null)
  if (!images.length) return null

  const advance = (direction: number) => {
    setSelected((current) => (current + direction + images.length) % images.length)
  }

  return (
    <Box
      role="region"
      aria-roledescription="carousel"
      aria-label={`${title} photos`}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault()
          advance(event.key === "ArrowLeft" ? -1 : 1)
        }
      }}
      sx={{ position: "relative", bgcolor: "#eff5f6", overflow: "hidden", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -3 } }}
    >
      <Box
        sx={{ position: "relative", aspectRatio: "4 / 5", touchAction: "pan-y" }}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return
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
        <Box sx={{ display: "flex", height: "100%", transform: `translateX(-${selected * 100}%)`, transition: "transform 550ms cubic-bezier(.22,1,.36,1)", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
          {images.map((image, index) => (
            <Box key={image.url} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${images.length}`} aria-hidden={index !== selected} sx={{ position: "relative", flex: "0 0 100%", minWidth: 0 }}>
              <Image src={image.url} alt={image.alt} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} preload={index === 0} loading={index === 0 ? undefined : "eager"} draggable={false} />
            </Box>
          ))}
        </Box>
      </Box>

      {images.length > 1 ? (
        <>
          <Box aria-hidden sx={{ position: "absolute", inset: "auto 0 0", height: 100, background: "linear-gradient(transparent, rgba(11,38,59,.5))", pointerEvents: "none" }} />
          <Stack direction="row" sx={{ position: "absolute", inset: "auto 18px 18px", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              {images.map((image, index) => (
                <ButtonBase key={image.url} aria-label={`View ${title} photo ${index + 1}`} aria-pressed={index === selected} onClick={() => setSelected(index)} sx={{ width: 32, height: 40, borderRadius: 2, "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 2 } }}>
                  <Box component="span" sx={{ height: 4, width: index === selected ? 28 : 12, borderRadius: 99, bgcolor: index === selected ? "#fff" : "#ffffff80", transition: "width 250ms ease", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }} />
                </ButtonBase>
              ))}
              <Typography aria-live="polite" aria-atomic="true" sx={{ color: "#fff", fontSize: 11, fontWeight: 500, letterSpacing: ".12em", pl: 1 }}>{String(selected + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</Typography>
            </Stack>
            <Stack direction="row" spacing={1}>
              {([-1, 1] as const).map((direction) => (
                <IconButton key={direction} aria-label={direction < 0 ? "Previous photo" : "Next photo"} onClick={() => advance(direction)} sx={{ width: 42, height: 42, color: "#fff", border: "1px solid #ffffff66", bgcolor: "#ffffff18", backdropFilter: "blur(12px)", "&:hover": { bgcolor: "#ffffff35" }, "&:focus-visible": { outline: "2px solid #fff", outlineOffset: 3 } }}>
                  <Icon name="arrowRight" sx={{ fontSize: 19, transform: direction < 0 ? "rotate(180deg)" : "none" }} />
                </IconButton>
              ))}
            </Stack>
          </Stack>
        </>
      ) : null}
    </Box>
  )
}
