"use client"

import Box from "@mui/material/Box"
import ButtonBase from "@mui/material/ButtonBase"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useState } from "react"

type ProductGalleryProps = {
  title: string
  images: { url: string }[]
  aspectRatio: string
}

export default function ProductGallery({ title, images, aspectRatio }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0)
  const active = images[selected] ?? images[0]
  if (!active) return null

  const photoLabel = (url: string, index: number) =>
    url.includes("_closed") ? `${title} closed kit` : url.includes("_open") ? `${title} open kit` : `${title} product photo ${index + 1}`

  return (
    <Box>
      <Box sx={{ position: "relative", aspectRatio, bgcolor: "#f4f7f8", overflow: "hidden" }}>
        <Image
          key={active.url}
          src={active.url}
          alt={photoLabel(active.url, selected)}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          style={{ objectFit: "contain" }}
          preload={selected === 0}
        />
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
              aria-label={`View ${photoLabel(image.url, index)}`}
              aria-pressed={index === selected}
              sx={{ position: "relative", width: 100, aspectRatio: "4 / 3", flexShrink: 0, overflow: "hidden", borderRadius: 1.5, border: "2px solid", borderColor: index === selected ? "primary.main" : "divider", bgcolor: "#f4f7f8", "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 } }}
            >
              <Image src={image.url} alt="" fill sizes="100px" style={{ objectFit: "contain" }} />
            </ButtonBase>
          ))}
        </Stack>
      ) : null}
    </Box>
  )
}
