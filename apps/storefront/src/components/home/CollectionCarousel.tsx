"use client"

import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { cheapestPrice, formatMoney, readProductMeta, sortedVariants } from "@/lib/product"
import { gutter } from "@/theme/tokens"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"

export default function CollectionCarousel({ products }: { products: HttpTypes.StoreProduct[] }) {
  const t = useTranslations("Common")
  const locale = useLocale()
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [interacting, setInteracting] = useState(false)
  const [focused, setFocused] = useState(false)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [visible, setVisible] = useState(true)
  const photos = products.filter(product => Boolean(product.thumbnail || product.images?.length))
  const count = photos.length
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotion = () => setMotionAllowed(!media.matches)
    const updateVisibility = () => setVisible(!document.hidden)
    updateMotion()
    updateVisibility()
    media.addEventListener("change", updateMotion)
    document.addEventListener("visibilitychange", updateVisibility)
    return () => { media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility) }
  }, [])
  const rotating = playing && !interacting && !focused && motionAllowed && visible && count > 1
  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => setIndex(value => (value + 1) % count), 6500)
    return () => window.clearInterval(timer)
  }, [rotating, count])
  if (!count) return null
  const currentIndex = index % count
  const product = photos[currentIndex]
  const meta = readProductMeta(product)
  const price = cheapestPrice(product)
  const select = (value: number) => { setIndex((value + count) % count); setPlaying(false) }
  return <Box component="section" aria-label={t("carousel")} aria-roledescription="carousel" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }} sx={{ px: gutter, pt: { xs: 2.5, md: 4 }, pb: 2, bgcolor: "#fbfcfe" }}>
    <Box sx={{ maxWidth: 1360, mx: "auto", position: "relative", overflow: "hidden", border: "1px solid", borderColor: "divider", borderRadius: "7px", background: "linear-gradient(120deg, #edf3fa, #fff 74%)" }}>
      <Stack direction="row" sx={{ px: { xs: 2.5, md: 4 }, pt: 2.5, alignItems: "center", justifyContent: "space-between", gap: 2 }}><Typography variant="mono" sx={{ color: "brand.blue", fontSize: 9, letterSpacing: ".14em" }}>VETUD / PEPTIDE SERIES</Typography><Typography variant="mono" sx={{ fontSize: 9, color: "text.secondary" }}>{String(currentIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</Typography></Stack>
      <Box key={product.id} role="group" aria-roledescription="slide" aria-label={t("slide", { current: currentIndex + 1, total: count })} sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", md: "1.12fr 1fr" }, alignItems: "center", gap: { xs: 0, md: 5 }, px: { xs: 2, md: 4 }, pb: { xs: 2, md: 3 }, animation: "vetud-enter .55s ease both" }}>
        <Box sx={{ position: "relative", minWidth: 0, height: { xs: 210, sm: 290, md: 330 }, mixBlendMode: "multiply" }}><Image src={product.thumbnail || product.images![0].url} alt={`${product.title} — VETUD Peptide Series`} fill sizes="(max-width: 900px) 90vw, 650px" preload={currentIndex === 0} style={{ objectFit: "contain" }} /></Box>
        <Box sx={{ pr: { md: 5 }, pb: { xs: 1, md: 0 }, minWidth: 0 }}>
          <Typography variant="mono" sx={{ fontSize: 10, color: "brand.blue", letterSpacing: ".1em" }}>{meta.code} / {meta.form}</Typography>
          <Typography component="h2" sx={{ fontSize: { xs: 32, sm: 42, md: 48 }, fontWeight: 400, letterSpacing: "-.055em", lineHeight: 1.12, my: 1.75 }}>{product.title}</Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary", maxWidth: 400, lineHeight: 1.8 }}>{sortedVariants(product).map(variant => variant.title).join(" / ")} {meta.purity ? ` · ${meta.purity}` : ""}</Typography>
          <Stack direction="row" sx={{ alignItems: "center", gap: 3, mt: 2.5, flexWrap: "wrap" }}><ButtonLink href={`/products/${product.handle}`} variant="contained" endIcon={<Icon name="arrowUpRight" />}>{t("viewProduct")}</ButtonLink>{price ? <Typography sx={{ fontSize: 18, fontWeight: 500 }}>{formatMoney(price.amount, price.currencyCode, { locale })}</Typography> : null}</Stack>
          <Typography sx={{ mt: 2.5, fontSize: 10, color: "text.secondary" }}>{t("research")}</Typography>
        </Box>
      </Box>
      {count > 1 ? <Stack direction="row" sx={{ px: { xs: 2.5, md: 4 }, py: 1.5, borderTop: "1px solid", borderColor: "divider", gap: 2, justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" sx={{ gap: 1, flex: 1, maxWidth: 420 }}>{photos.map((item, i) => <Box key={item.id} component="button" type="button" aria-label={item.title} aria-pressed={currentIndex === i} onClick={() => select(i)} sx={{ border: 0, p: 0, height: 28, minWidth: 24, flex: 1, bgcolor: "transparent", cursor: "pointer", display: "flex", alignItems: "center", "&::after": { content: '""', height: 2, width: "100%", bgcolor: currentIndex === i ? "brand.blue" : "#ced9e7", transition: "background-color .3s" } }} />)}</Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: .25 }}><IconButton aria-label={playing ? t("pause") : t("play")} onClick={() => setPlaying(value => !value)}><Typography component="span" aria-hidden sx={{ fontFamily: "sans-serif", fontSize: 15 }}>{playing ? "Ⅱ" : "▷"}</Typography></IconButton><IconButton aria-label={t("previous")} onClick={() => select(currentIndex - 1)}><Icon name="arrowRight" sx={{ fontSize: 19, transform: "rotate(180deg)" }} /></IconButton><IconButton aria-label={t("next")} onClick={() => select(currentIndex + 1)}><Icon name="arrowRight" sx={{ fontSize: 19 }} /></IconButton></Stack>
      </Stack> : null}
    </Box>
  </Box>
}
