"use client"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useRef, useState } from "react"

type ProductGalleryProps = {
  title: string
  images: { url: string; alt?: string }[]
  aspectRatio: string
}

export default function ProductGallery({ title, images, aspectRatio }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const active = images[selected] ?? images[0]
  if (!active) return null

  const photoLabel = (image: ProductGalleryProps["images"][number], index: number) =>
    image.alt ?? (/[_-]closed/.test(image.url) ? `${title} closed packaging` : /[_-]open/.test(image.url) ? `${title} open packaging` : `${title} product photo ${index + 1}`)
  const viewLabel = (url: string, index: number) =>
    /[_-]closed/.test(url) ? "Closed box" : /[_-]open/.test(url) ? "Open kit" : index === 0 ? "Front view" : "Alternate view"
  const advance = (direction: number) => setSelected(value => (value + direction + images.length) % images.length)

  return (
    <Box role="group" aria-label={`${title} product gallery`} onKeyDown={event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault()
        advance(event.key === "ArrowRight" ? 1 : -1)
      }
    }}>
      <Box
        onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY } }}
        onTouchCancel={() => { touchStart.current = null }}
        onTouchEnd={event => {
          if (!touchStart.current) return
          const dx = event.changedTouches[0].clientX - touchStart.current.x
          const dy = event.changedTouches[0].clientY - touchStart.current.y
          touchStart.current = null
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) advance(dx < 0 ? 1 : -1)
        }}
        sx={{ position: "relative", aspectRatio, maxHeight: { sm: 600 }, bgcolor: "#fff", overflow: "hidden", touchAction: "pan-y" }}
      >
        <Box sx={{ position: "absolute", inset: { xs: "4%", sm: "5%" } }}>
          <Image
            key={active.url}
            src={active.url}
            alt={photoLabel(active, selected)}
            fill
            sizes="(max-width: 600px) 90vw, (max-width: 900px) 85vw, 45vw"
            style={{ objectFit: "contain" }}
            preload={selected === 0}
          />
        </Box>
        {images.length > 1 ? (
          <Typography aria-live="polite" sx={{ position: "absolute", right: 12, bottom: 12, px: 1.2, py: 0.4, borderRadius: 10, bgcolor: "#ffffffdd", color: "text.secondary", fontSize: 11 }}>
            {selected + 1} / {images.length}
          </Typography>
        ) : null}
      </Box>

      {images.length > 1 ? (
        <Stack direction="row" spacing={1.25} sx={{ p: 1.5, bgcolor: "#fff", borderTop: "1px solid", borderColor: "divider", overflowX: "auto" }}>
          {images.map((image, index) => (
            <ButtonBase
              key={image.url}
              onClick={() => setSelected(index)}
              aria-label={`View ${photoLabel(image, index)}`}
              aria-pressed={index === selected}
              sx={{ width: { xs: 88, sm: 104 }, p: .75, display: "flex", flexDirection: "column", gap: .5, flexShrink: 0, borderRadius: 1.5, border: "2px solid", borderColor: index === selected ? "primary.main" : "divider", bgcolor: "#fff", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 } }}
            >
              <Box sx={{ position: "relative", width: "100%", aspectRatio: "4 / 3" }}><Image src={image.url} alt="" fill loading="lazy" sizes="100px" style={{ objectFit: "contain" }} /></Box>
              <Typography component="span" sx={{ fontSize: 10, color: index === selected ? "primary.main" : "text.secondary", lineHeight: 1.5 }}>{viewLabel(image.url, index)}</Typography>
            </ButtonBase>
          ))}
        </Stack>
      ) : null}
    </Box>
  )
}
