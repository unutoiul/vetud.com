"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import IconButton from "@mui/material/IconButton"
import Image from "next/image"
import { useEffect, useId, useRef, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { BOOK } from "./book"

export default function BookCoverZoom() {
  const ct = useContentTranslator()
  const [open, setOpen] = useState(false)
  const [zoomed, setZoomed] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  const image = useRef<HTMLImageElement>(null)
  const point = useRef({ x: 0.5, y: 0.5 })
  const titleId = useId()
  const zoomLabel = zoomed ? ct("Fit to screen") : ct("Zoom in")

  // Keep the detail the reader tapped in view when switching to the full-resolution image.
  useEffect(() => {
    const view = viewport.current
    const cover = image.current
    if (!open || !zoomed || !view || !cover) return
    const observer = new ResizeObserver(() => {
      if (cover.clientWidth !== BOOK.width) return
      view.scrollLeft = point.current.x * view.scrollWidth - view.clientWidth / 2
      view.scrollTop = point.current.y * view.scrollHeight - view.clientHeight / 2
      observer.disconnect()
    })
    observer.observe(cover)
    return () => observer.disconnect()
  }, [open, zoomed])

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label={ct("Enlarge book cover")}
        title={ct("Enlarge book cover")}
        aria-haspopup="dialog"
        onClick={event => {
          event.currentTarget.focus({ preventScroll: true })
          setZoomed(false)
          setOpen(true)
        }}
        sx={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          p: 0, border: 0, background: "transparent", cursor: "zoom-in",
          "&:focus-visible": { outline: `3px solid ${brand.white}`, outlineOffset: "-6px", boxShadow: `inset 0 0 0 7px ${brand.navyDeep}` },
          "&:hover > span, &:focus-visible > span": { bgcolor: "brand.white" },
        }}
      >
        <Box component="span" sx={{
          position: "absolute", top: 10, right: 10, display: "grid", placeItems: "center",
          width: 36, height: 36, borderRadius: "50%", bgcolor: "brand.whiteA94", color: "brand.navyDeep",
          boxShadow: `0 2px 8px ${brand.blackA22}`,
        }}>
          <Icon name="zoomIn" sx={{ fontSize: 21 }} />
        </Box>
      </Box>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby={titleId}
        maxWidth={false}
        slotProps={{ paper: { sx: {
          m: { xs: 0, sm: 2 }, width: { xs: "100%", sm: "min(94vw, 1160px)" },
          height: { xs: "100dvh", sm: "92dvh" }, maxWidth: "none", maxHeight: "none", overflow: "hidden",
          borderRadius: { xs: 0, sm: "14px" }, bgcolor: "brand.blue925", color: "brand.white",
        } } }}
      >
        <Box sx={{
          display: "flex", alignItems: "center", gap: 1, pl: 2, pr: 1, py: 1,
          paddingTop: "max(8px, env(safe-area-inset-top))", bgcolor: "brand.blue875",
          borderBottom: `1px solid ${brand.whiteA16}`,
        }}>
          <Box component="h2" id={titleId} sx={{ m: 0, flex: 1, fontWeight: 600, fontSize: { xs: 15, sm: 18 }, lineHeight: 1.3 }}>
            {BOOK.title}
          </Box>
          <Button
            onClick={() => {
              point.current = { x: 0.5, y: 0.5 }
              setZoomed(!zoomed)
            }}
            startIcon={<Icon name={zoomed ? "minus" : "zoomIn"} />}
            sx={{ minHeight: 44, flexShrink: 0, color: "brand.white", bgcolor: "brand.whiteA13", "&:hover": { bgcolor: "brand.whiteA33" } }}
          >
            {zoomLabel}
          </Button>
          <IconButton autoFocus aria-label={ct("Close")} onClick={() => setOpen(false)} sx={{ color: "inherit", width: 44, height: 44 }}>
            <Icon name="close" />
          </IconButton>
        </Box>
        <Box ref={viewport} sx={{ flex: 1, minHeight: 0, overflow: "auto", overscrollBehavior: "contain", containerType: "size" }}>
          <Box sx={{ minWidth: "100%", width: "max-content", minHeight: "100%", display: "grid", placeItems: "center" }}>
            <Box
              component="button"
              type="button"
              aria-label={zoomLabel}
              onClick={event => {
                const rect = event.currentTarget.getBoundingClientRect()
                point.current = event.detail
                  ? { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height }
                  : { x: 0.5, y: 0.5 }
                setZoomed(!zoomed)
              }}
              style={{
                width: zoomed ? BOOK.width : `min(100cqw, ${100 * BOOK.width / BOOK.height}cqh, ${BOOK.width}px)`,
                cursor: zoomed ? "zoom-out" : "zoom-in",
              }}
              sx={{
                display: "block", border: 0, p: 0, background: "transparent",
                "&:focus-visible": { outline: `3px solid ${brand.white}`, outlineOffset: "-4px" },
              }}
            >
              <Image ref={image} src={BOOK.cover} alt={BOOK.title} unoptimized loading="eager" width={BOOK.width} height={BOOK.height}
                style={{ display: "block", width: "100%", height: "auto" }} />
            </Box>
          </Box>
        </Box>
      </Dialog>
    </>
  )
}
