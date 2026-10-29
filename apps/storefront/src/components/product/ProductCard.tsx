"use client"

import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useLocale } from "next-intl"
import Icon from "@/components/brand/Icon"
import { SITE } from "@/lib/config"
import { cheapestPrice, formatMoney, isProductInStock, readProductMeta, sortedVariants } from "@/lib/product"
import { getProductResearch } from "@/content/product-research"
import { getProductImages } from "@/lib/product-images"
import { LocalizedNextLink } from "../common/links"
import ProductArt from "./ProductArt"
import StockBadge from "./StockBadge"

export function ArtStage({ children, height = 290 }: { children: React.ReactNode; height?: number | object }) {
  return <Box sx={{ position: "relative", height, overflow: "hidden", display: "grid", placeItems: "center", background: "linear-gradient(140deg, #f7faff, #eaf0f8)" }}>{children}</Box>
}

export default function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const locale = useLocale()
  const meta = readProductMeta(product)
  const profile = getProductResearch(product.handle)
  const price = cheapestPrice(product)
  const inStock = isProductInStock(product)
  const image = getProductImages(product)[0]
  return <Box component="article" sx={{ height: "100%", position: "relative", display: "flex", flexDirection: "column", "@media (hover: hover) and (prefers-reduced-motion: no-preference)": { "&:hover .product-image": { transform: "scale(1.025)" } }, "&:hover .product-arrow": { bgcolor: "brand.navy", color: "#fff" }, "&:focus-within": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 5 } }}>
    <Box sx={{ position: "relative", overflow: "hidden", borderRadius: "5px", border: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
      {image ? <Box sx={{ aspectRatio: "4 / 3", position: "relative" }}><Box sx={{ position: "absolute", inset: "8% 5% 4%" }}><Image className="product-image" src={image.url} alt={image.alt ?? `${product.title} VETUD packaging`} fill loading="lazy" sizes="(max-width: 600px) calc(100vw - 60px), (max-width: 900px) 45vw, 30vw" style={{ objectFit: "contain", transition: "transform .35s ease" }} /></Box></Box> : <ArtStage height={{ xs: 270, sm: 290 }}><Box sx={{ width: "100%", maxWidth: 330 }}><ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} /></Box></ArtStage>}
      <Typography variant="mono" sx={{ position: "absolute", left: 15, top: 14, fontSize: 9, color: "brand.navy", bgcolor: "rgba(255,255,255,.9)", border: "1px solid", borderColor: "divider", px: 1, py: .5 }}>{meta.code}</Typography>
    </Box>
    <Box sx={{ pt: 2.5, pb: 2, flex: 1, display: "flex", flexDirection: "column" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography component="h3" sx={{ fontSize: 23, fontWeight: 500, letterSpacing: "-.04em" }}><Box component={LocalizedNextLink} href={`/products/${product.handle}`} sx={{ textDecoration: "none", "&::after": { content: '\"\"', position: "absolute", inset: 0, zIndex: 2 }, "&:focus-visible": { outline: "none" } }}>{product.title}</Box></Typography>
        <Box className="product-arrow" aria-hidden sx={{ width: 33, height: 33, flexShrink: 0, border: "1px solid", borderColor: "divider", borderRadius: "50%", display: "grid", placeItems: "center", transition: "background-color .2s, color .2s" }}><Icon name="arrowUpRight" sx={{ fontSize: 16 }} /></Box>
      </Stack>
      <Typography sx={{ color: "brand.blue", fontSize: 11.5, mt: .5 }}>{profile?.classification ?? product.subtitle ?? meta.form}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 1.25, mb: 2 }}>{meta.form ?? "Research material"}{product.variants?.length ? ` · ${sortedVariants(product).map(v => v.title).join(" / ")}` : ""}</Typography>
      <Stack direction="row" sx={{ mt: "auto", pt: 2, borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{price ? <>{price.hasRange ? <Box component="span" sx={{ color: "text.secondary", fontWeight: 400, fontSize: 11, mr: .5 }}>From</Box> : null}{formatMoney(price.amount, price.currencyCode, { locale })}</> : "Price on request"}</Typography>
        <StockBadge inStock={inStock} />
      </Stack>
      <Typography sx={{ color: "text.secondary", fontSize: 10, mt: 1.5, lineHeight: 1.5 }}>{SITE.productDisclaimer}</Typography>
    </Box>
  </Box>
}
