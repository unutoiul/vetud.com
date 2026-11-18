"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Link from "@mui/material/Link"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import type { CollectionResearch } from "@/content/collection-research"
import { cheapestPrice, readProductMeta } from "@/lib/product"
import { useMoney } from "@/lib/money"
import { brand } from "@/theme/tokens"
import { hasFormats, shortAvailability } from "@/lib/product-formats"
import { getProductImages } from "@/lib/product-images"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"
import ProductPhoto from "../product/ProductPhoto"
import ProductBadges from "../product/ProductBadges"

/** A wide fan of product cards with a prominent, fully readable centre card. */
export default function CollectionCarousel({ products, researchById }: { products: HttpTypes.StoreProduct[]; researchById: Record<string, CollectionResearch> }) {
  const ct = useContentTranslator()
  const t = useTranslations("Common")
  const money = useMoney()
  const photos = products.filter(product => product.handle !== "u-100-syringes" && getProductImages(product).length > 0)
  const count = photos.length
  const root = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const lastSwipe = useRef(0)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setMotionAllowed(!media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!root.current) return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .3 })
    observer.observe(root.current)
    return () => observer.disconnect()
  }, [count])

  const rotating = playing && !hovered && motionAllowed && visible && count > 1
  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(value => (value + 1) % count)
    }, 12000)
    return () => window.clearInterval(timer)
  }, [rotating, count])

  if (!count) return null
  const current = index % count
  const product = photos[current]
  const research = researchById[product.id]
  const select = (value: number) => {
    setPlaying(false)
    setIndex((value + count) % count)
  }

  return <Box ref={root} role="region" aria-label={t("carousel")} aria-roledescription="carousel" data-hero-carousel onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setPlaying(false)} sx={{ minWidth: 0, position: "relative", mt: { xs: 2, md: 0 }, display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, .85fr) minmax(0, 1.5fr)" }, alignItems: "center", columnGap: { md: 4, lg: 6 } }}>
    <Box component="section" aria-label={ct("Research for the selected material")} aria-live={playing ? "off" : "polite"} aria-atomic="true" data-carousel-research data-product-handle={product.handle} sx={{ order: { xs: 2, md: 0 }, position: "relative", zIndex: 4, minWidth: 0, minHeight: { xs: 340, md: 380 }, mt: { xs: 3, md: 0 }, py: { xs: 2.5, md: 3 }, borderTop: { xs: "1px solid", md: "none" }, borderColor: "divider" }}>
      <Typography sx={{ color: "brand.blue", fontSize: 13, fontWeight: 600, mb: 1.25 }}>{ct(research?.focus ?? "Research overview")}</Typography>
      <Typography component="h1" translate="no" sx={{ fontSize: { xs: 30, md: 36, lg: 42 }, lineHeight: 1.15, letterSpacing: "-.04em", fontWeight: 500, overflowWrap: "anywhere" }}>{ct(product.title)}</Typography>
      {research ? <>
        <Typography sx={{ mt: 2, fontSize: { xs: 22, md: 25 }, lineHeight: 1.3, letterSpacing: "-.025em", color: "brand.navy" }}>{ct(research.headline)}</Typography>
        <Typography sx={{ mt: 2, fontSize: 14, lineHeight: 1.75, color: "text.secondary", maxWidth: 520 }}>{ct(research.study)}</Typography>
        <Stack direction="row" sx={{ mt: 2, alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: "brand.navySoft", bgcolor: "brand.mint", borderRadius: "6px", px: 1.25, py: .6 }}>{ct(research.evidence)}</Typography>
          {research.source ? <Link href={research.source.url} target="_blank" rel="noopener noreferrer" aria-label={`${ct("Study source")}: ${ct(research.source.title)}`} sx={{ display: "inline-flex", alignItems: "center", gap: .5, minHeight: 44, fontSize: 13, color: "brand.blue", textUnderlineOffset: "3px", "&:focus-visible": { outline: `2px solid ${brand.blue}`, outlineOffset: 3 } }}>{ct("Study source")}<Icon name="arrowUpRight" sx={{ fontSize: 15 }} /></Link> : null}
        </Stack>
      </> : null}
    </Box>
    <Box sx={{ minWidth: 0, overflow: "clip" }}>
    <Box
      onFocusCapture={() => setPlaying(false)}
      onTouchStart={event => { const touch = event.touches[0]; touchStart.current = { x: touch.clientX, y: touch.clientY }; setPlaying(false) }}
      onTouchEnd={event => {
        if (!touchStart.current) return
        const dx = event.changedTouches[0].clientX - touchStart.current.x
        const dy = event.changedTouches[0].clientY - touchStart.current.y
        touchStart.current = null
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          select(current + (dx < 0 ? 1 : -1))
          lastSwipe.current = event.timeStamp
        }
      }}
      onTouchCancel={() => { touchStart.current = null }}
      onClickCapture={event => { if (lastSwipe.current && event.timeStamp - lastSwipe.current < 700) event.preventDefault() }}
      sx={{ position: "relative", height: { xs: 385, sm: 440, md: 490, lg: 520 }, perspective: 1800, touchAction: "pan-y" }}
    >
      {photos.map((product, productIndex) => {
        let position = (productIndex - current + count) % count
        if (position > count / 2) position -= count
        const active = position === 0
        const distance = Math.abs(position)
        // One card each side, tucked behind the centre card. The fan sits inside its column, so the
        // side cards stay whole instead of being cut off by the column's edge (owner report
        // 2026-11-18). On phones the side cards still run off the screen edge, as a swipe hint.
        const hidden = distance > 1
        const fan = (offset: number, turn: number, scale: number) => `translate(${-50 + position * offset}%, ${-50 + distance * 3}%) rotate(${position * turn}deg) scale(${active ? 1 : scale})`
        const meta = readProductMeta(product)
        const price = cheapestPrice(product)
        const images = getProductImages(product)
        return <Box key={product.id} role="group" aria-roledescription="slide" aria-label={t("slide", { current: productIndex + 1, total: count })} aria-hidden={!active || undefined} inert={hidden} data-active={active} sx={{ position: "absolute", left: "50%", top: "50%", width: { xs: "82%", sm: "48%", md: "62%", lg: "57%" }, maxWidth: 420, zIndex: active ? 3 : hidden ? 0 : 3 - distance, opacity: hidden ? 0 : 1, visibility: hidden ? "hidden" : "visible", transform: { xs: fan(64, 4, .9), sm: fan(46, 3, .88), md: fan(32, 3, .86), lg: fan(38, 3, .86), xl: fan(54, 3, .88) }, transition: "transform .7s cubic-bezier(.22,.68,0,1), opacity .45s, visibility .45s", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
          {/* A side card is clickable: it moves to the centre (and the research text follows). It stays
              out of the keyboard order; the previous and next buttons do the same job there. */}
          <Box component={LocalizedNextLink} href={`/products/${product.handle}`} tabIndex={active ? undefined : -1} onClick={active ? undefined : (event: React.MouseEvent) => { event.preventDefault(); select(productIndex) }} sx={{ display: "flex", flexDirection: "column", minHeight: { xs: 350, sm: 390, md: 430, lg: 450 }, p: { xs: 1.75, md: 2.5 }, gap: { xs: 1.75, md: 2 }, boxSizing: "border-box", overflow: "hidden", border: "1px solid", borderColor: active ? brand.lineStrong : brand.line, borderRadius: "14px", bgcolor: "#fff", color: "inherit", textDecoration: "none", boxShadow: active ? "0 24px 64px -20px rgba(21,38,94,.28), 0 4px 12px rgba(21,38,94,.04)" : "0 14px 40px -18px rgba(21,38,94,.2)", "&:focus-visible": { outline: `3px solid ${brand.blue}`, outlineOffset: 4 }, "&:hover .hero-product-arrow": { bgcolor: brand.navy, color: "#fff" } }}>
            <Box sx={{ height: { xs: 165, sm: 195, md: 225, lg: 245 }, flexShrink: 0, display: "flex", flexDirection: "column", p: .5, borderRadius: "8px", bgcolor: "#fff" }}>
              <ProductBadges metadata={product.metadata} />
              <Box sx={{ position: "relative", flex: 1, minHeight: 0 }}>
                <ProductPhoto images={images} title={ct(product.title)} sizes="(max-width: 600px) 75vw, (max-width: 900px) 44vw, (max-width: 1600px) 27vw, 420px" preload={productIndex === 0} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, px: .5, pb: .5 }}>
              <Typography component="h3" translate="no" sx={{ fontSize: { xs: 21, md: 25 }, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1.2, overflowWrap: "anywhere" }}>{ct(product.title)}</Typography>
              <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary", lineHeight: 1.6 }}>{shortAvailability(product, ct)}</Typography>
              {hasFormats(product) ? null : <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.6 }}>{ct(meta.form)}</Typography>}
              <Stack direction="row" sx={{ mt: "auto", pt: 2, alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{ct(price ? `${t("from")} ${money(price.amount, price.currencyCode)}` : t("viewProduct"))}</Typography>
                <Box className="hero-product-arrow" sx={{ display: "grid", placeItems: "center", width: 34, height: 34, border: "1px solid", borderColor: "divider", borderRadius: "50%", color: "brand.blue", transition: "background-color .2s, color .2s" }}><Icon name="arrowUpRight" sx={{ fontSize: 16 }} /></Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      })}
    </Box>

    {count > 1 ? <Stack direction="row" sx={{ justifyContent: "center", alignItems: "center", gap: 1, mt: { xs: 2, sm: 2.5 } }}>
      <IconButton aria-label={t("previous")} onFocus={() => setPlaying(false)} onClick={() => select(current - 1)} sx={{ width: 44, height: 44, bgcolor: "#ffffffd9", border: "1px solid", borderColor: "divider", color: "brand.navy" }}><Icon name="arrowRight" sx={{ fontSize: 18, transform: "rotate(180deg)" }} /></IconButton>
      <Typography aria-label={t("slide", { current: current + 1, total: count })} sx={{ minWidth: 65, textAlign: "center", fontSize: 12, color: "brand.navySoft", fontVariantNumeric: "tabular-nums" }}>{ct(String(current + 1).padStart(2, "0"))} / {ct(String(count).padStart(2, "0"))}</Typography>
      <IconButton aria-label={t("next")} onFocus={() => setPlaying(false)} onClick={() => select(current + 1)} sx={{ width: 44, height: 44, bgcolor: "#ffffffd9", border: "1px solid", borderColor: "divider", color: "brand.navy" }}><Icon name="arrowRight" sx={{ fontSize: 18 }} /></IconButton>
      <IconButton aria-label={ct(playing && motionAllowed ? t("pause") : t("play"))} aria-pressed={playing && motionAllowed} onClick={() => setPlaying(value => !value)} disabled={!motionAllowed} sx={{ width: 44, height: 44, bgcolor: "#ffffffd9", color: "brand.navy" }}>
        <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" sx={{ width: 16, height: 16, fill: "currentColor" }}>{playing && motionAllowed ? <path d="M7 5h3v14H7zm7 0h3v14h-3z" /> : <path d="m8 5 11 7-11 7z" />}</Box>
      </IconButton>
    </Stack> : null}
    </Box>
  </Box>
}
