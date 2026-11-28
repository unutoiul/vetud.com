"use client"

import { ZoomInOutlined } from "@ant-design/icons"
import { Grid, Image as AntImage } from "antd"
import NextImage from "next/image"
import { useState } from "react"
import { colors, fonts, gradients, shadows } from "@/theme/tokens"
import { format } from "@/i18n/format"
import { useMessages } from "./MessagesProvider"
import { Section, SectionHeading } from "./ui"

/**
 * The owner's photos of the filling line and the cold store, graded to one look by
 * scripts/prepare-images.mjs (sources in assets/VETUD_Facility_Photos). Captions say only what the
 * photos show. The captions and alt texts are facility.photos in the messages, in this order.
 */
const PHOTOS = [
  // Keeps the worker and the tray of vials in frame when the tile is cropped.
  { src: "/images/facility-cleanroom.webp", position: "94% 50%" },
  { src: "/images/facility-cold-storage.webp", position: "50% 42%" },
  { src: "/images/facility-cabinets.webp", position: "50% 50%" },
]

type Photo = (typeof PHOTOS)[number] & { alt: string; eyebrow: string; title: string; text: string }

function PhotoTile({
  photo,
  onOpen,
  inGrid,
  gridRow,
  sizes,
}: {
  photo: Photo
  onOpen: () => void
  /** In the desktop grid the tile fills its cell; stacked on phones it keeps a 4:3 shape. */
  inGrid: boolean
  gridRow?: string
  sizes: string
}) {
  const t = useMessages().facility
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={format(t.enlargeAria, { title: photo.title })}
      style={{
        position: "relative",
        gridRow,
        minHeight: 0,
        aspectRatio: inGrid ? undefined : "4 / 3",
        display: "block",
        width: "100%",
        padding: 0,
        border: `1px solid ${colors.line}`,
        borderRadius: 20,
        overflow: "hidden",
        cursor: "zoom-in",
        background: colors.navyDeep,
        boxShadow: shadows.lifted,
        textAlign: "left",
        font: "inherit",
      }}
    >
      <NextImage
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={sizes}
        quality={85}
        style={{ objectFit: "cover", objectPosition: photo.position }}
      />
      <div
        aria-hidden
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "62%", background: gradients.artFade }}
      />
      <span
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          color: colors.onNavy,
          background: colors.nightGlass,
          border: `1px solid ${colors.onNavyLine}`,
          borderRadius: 999,
          padding: "4px 10px",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      >
        <ZoomInOutlined /> {t.enlarge}
      </span>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "clamp(18px, 2.4vw, 28px)" }}>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: colors.tealBright,
          }}
        >
          {photo.eyebrow}
        </div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: "clamp(22px, 2.2vw, 28px)",
            fontWeight: 500,
            color: colors.white,
            lineHeight: 1.2,
            margin: "6px 0 4px",
          }}
        >
          {photo.title}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: colors.onNavyMuted, maxWidth: 440 }}>{photo.text}</div>
      </div>
    </button>
  )
}

/** "Made clean. Kept cold.": the filling line and the cold store, all three photos visible at once. */
export default function Facility() {
  const screens = Grid.useBreakpoint()
  const [open, setOpen] = useState<number | null>(null)
  const wide = !!screens.md
  const t = useMessages().facility
  const photos: Photo[] = PHOTOS.map((photo, index) => ({ ...photo, ...t.photos[index] }))

  return (
    <Section id="facility" background={colors.aquaWash}>
      <SectionHeading eyebrow={t.eyebrow} title={t.title} subtitle={t.subtitle} />
      <div
        style={
          wide
            ? {
                display: "grid",
                gridTemplateColumns: "7fr 5fr",
                gridTemplateRows: "1fr 1fr",
                gap: 20,
                height: "clamp(480px, 48vw, 600px)",
              }
            : { display: "grid", gridTemplateColumns: "1fr", gap: 16 }
        }
      >
        {photos.map((photo, index) => (
          <PhotoTile
            key={photo.src}
            photo={photo}
            onOpen={() => setOpen(index)}
            inGrid={wide}
            gridRow={wide && index === 0 ? "1 / 3" : undefined}
            sizes={
              wide ? (index === 0 ? "(max-width: 1200px) 58vw, 680px" : "(max-width: 1200px) 42vw, 480px") : "100vw"
            }
          />
        ))}
      </div>
      <AntImage.PreviewGroup
        items={photos.map((photo) => ({ src: photo.src, alt: photo.alt }))}
        preview={{
          open: open !== null,
          current: open ?? 0,
          onOpenChange: (next) => !next && setOpen(null),
          onChange: (current) => setOpen(current),
        }}
      />
    </Section>
  )
}
