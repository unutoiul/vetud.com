"use client"

import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { cheapestPrice, formatMoney, readProductMeta, sortedVariants } from "@/lib/product"
import { brand } from "@/theme/tokens"
import { getProductImages } from "@/lib/product-images"
import Icon from "../brand/Icon"
import { LocalizedNextLink } from "../common/links"

/** Product cards share the hero's alpine stage; the active card sits above its neighbours. */
export default function CollectionCarousel({ products }: { products: HttpTypes.StoreProduct[] }) {
  const t = useTranslations("Common")
  const locale = useLocale()
  const photos = products.filter(product => getProductImages(product).length > 0)
  const count = photos.length
  const root = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const lastSwipe = useRef(0)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
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
    }, 5500)
    return () => window.clearInterval(timer)
  }, [rotating, count])

  if (!count) return null
  const current = index % count
  const select = (value: number) => {
    setPlaying(false)
    setIndex((value + count) % count)
  }

  return <Box ref={root} role="region" aria-label={t("carousel")} aria-roledescription="carousel" data-hero-carousel onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} sx={{ minWidth: 0, position: "relative", mt: { xs: 2, md: 0 } }}>
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
      sx={{ position: "relative", height: { xs: 360, sm: 420, md: 440, lg: 460 }, perspective: 1400, touchAction: "pan-y" }}
    >
      {photos.map((product, productIndex) => {
        let position = (productIndex - current + count) % count
        if (position > count / 2) position -= count
        const active = position === 0
        const hidden = Math.abs(position) > 1
        const meta = readProductMeta(product)
        const price = cheapestPrice(product)
        const image = getProductImages(product)[0]
        return <Box key={product.id} role="group" aria-roledescription="slide" aria-label={t("slide", { current: productIndex + 1, total: count })} aria-hidden={hidden || undefined} inert={hidden} data-active={active} sx={{ position: "absolute", left: "50%", top: "50%", width: { xs: "70%", sm: "54%", md: "62%" }, maxWidth: 340, zIndex: active ? 3 : hidden ? 0 : 1, opacity: hidden ? 0 : 1, visibility: hidden ? "hidden" : "visible", transform: `translate(${-50 + position * 46}%, ${-50 + Math.abs(position) * 5}%) rotate(${position * 8}deg) scale(${active ? 1 : .83})`, transition: "transform .7s cubic-bezier(.22,.68,0,1), opacity .45s, visibility .45s", "@media (prefers-reduced-motion: reduce)": { transition: "none" } }}>
          <Box component={LocalizedNextLink} href={`/products/${product.handle}`} sx={{ display: "flex", flexDirection: "column", minHeight: { xs: 340, sm: 380, md: 395, lg: 405 }, p: { xs: 1.75, md: 2 }, gap: { xs: 1.75, md: 2 }, boxSizing: "border-box", overflow: "hidden", border: "1px solid", borderColor: active ? brand.lineStrong : brand.line, borderRadius: "14px", bgcolor: "#fff", color: "inherit", textDecoration: "none", boxShadow: active ? "0 24px 64px -20px rgba(21,38,94,.28), 0 4px 12px rgba(21,38,94,.04)" : "0 14px 40px -18px rgba(21,38,94,.2)", "&:focus-visible": { outline: `3px solid ${brand.blue}`, outlineOffset: 4 }, "&:hover .hero-product-arrow": { bgcolor: brand.navy, color: "#fff" } }}>
            <Box sx={{ height: { xs: 150, sm: 185, md: 190, lg: 205 }, flexShrink: 0, p: .5, borderRadius: "8px", bgcolor: "#fff" }}>
              <Box sx={{ position: "relative", height: "100%" }}>
                <Image src={image.url} alt={image.alt ?? `${product.title} — VETUD Peptide Series`} fill sizes="(max-width: 600px) 65vw, 340px" preload={productIndex === 0} draggable={false} style={{ objectFit: "contain" }} />
              </Box>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1, px: .5, pb: .5 }}>
              <Typography component="h2" translate="no" sx={{ fontSize: { xs: 21, md: 25 }, fontWeight: 500, letterSpacing: "-.04em", lineHeight: 1.2, overflowWrap: "anywhere" }}>{product.title}</Typography>
              <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary", lineHeight: 1.6 }}>{sortedVariants(product).map(variant => variant.title).join(" / ")}</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary", lineHeight: 1.6 }}>{meta.form}</Typography>
              <Stack direction="row" sx={{ mt: "auto", pt: 2, alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{price ? `${t("from")} ${formatMoney(price.amount, price.currencyCode, { locale })}` : t("viewProduct")}</Typography>
                <Box className="hero-product-arrow" sx={{ display: "grid", placeItems: "center", width: 34, height: 34, border: "1px solid", borderColor: "divider", borderRadius: "50%", color: "brand.blue", transition: "background-color .2s, color .2s" }}><Icon name="arrowUpRight" sx={{ fontSize: 16 }} /></Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      })}
    </Box>

    {count > 1 ? <Stack direction="row" sx={{ justifyContent: "center", alignItems: "center", gap: 1, mt: { xs: 2, sm: 2.5 } }}>
      <IconButton aria-label={t("previous")} onFocus={() => setPlaying(false)} onClick={() => select(current - 1)} sx={{ width: 44, height: 44, bgcolor: "#ffffffd9", border: "1px solid", borderColor: "divider", color: "brand.navy" }}><Icon name="arrowRight" sx={{ fontSize: 18, transform: "rotate(180deg)" }} /></IconButton>
      <Typography aria-label={t("slide", { current: current + 1, total: count })} sx={{ minWidth: 65, textAlign: "center", fontSize: 12, color: "brand.navySoft", fontVariantNumeric: "tabular-nums" }}>{String(current + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</Typography>
      <IconButton aria-label={t("next")} onFocus={() => setPlaying(false)} onClick={() => select(current + 1)} sx={{ width: 44, height: 44, bgcolor: "#ffffffd9", border: "1px solid", borderColor: "divider", color: "brand.navy" }}><Icon name="arrowRight" sx={{ fontSize: 18 }} /></IconButton>
      <IconButton aria-label={playing && motionAllowed ? t("pause") : t("play")} aria-pressed={playing && motionAllowed} onClick={() => setPlaying(value => !value)} disabled={!motionAllowed} sx={{ width: 44, height: 44, bgcolor: "#ffffffd9", color: "brand.navy" }}>
        <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" sx={{ width: 16, height: 16, fill: "currentColor" }}>{playing && motionAllowed ? <path d="M7 5h3v14H7zm7 0h3v14h-3z" /> : <path d="m8 5 11 7-11 7z" />}</Box>
      </IconButton>
    </Stack> : null}
  </Box>
}
