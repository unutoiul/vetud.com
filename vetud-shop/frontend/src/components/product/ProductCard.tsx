"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Icon from "@/components/brand/Icon"
import { cheapestPrice, isProductInStock, percentOff, readProductMeta } from "@/lib/product"
import { useMoney } from "@/lib/money"
import { hasFormats, shortAvailability } from "@/lib/product-formats"
import { getProductImages } from "@/lib/product-images"
import { LocalizedNextLink } from "../common/links"
import ProductArt from "./ProductArt"
import ProductPhoto from "./ProductPhoto"
import StockBadge from "./StockBadge"
import ProductBadges from "./ProductBadges"

/** Read by screen readers only. */
const visuallyHidden = { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const

export function ArtStage({ children, height = 290 }: { children: React.ReactNode; height?: number | object }) {
  return <Box sx={{ position: "relative", height, overflow: "hidden", display: "grid", placeItems: "center", background: "linear-gradient(140deg, #f7faff, #eaf0f8)" }}>{children}</Box>
}

export default function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const ct = useContentTranslator()
  const money = useMoney()
  const meta = readProductMeta(product)
  const price = cheapestPrice(product)
  const off = percentOff(price)
  const inStock = isProductInStock(product)
  const images = getProductImages(product)
  const detail = hasFormats(product) ? shortAvailability(product, ct) : `${ct(meta.form ?? "Research material")}${product.variants?.length ? ` · ${shortAvailability(product, ct)}` : ""}`
  return <Box component="article" sx={{ height: "100%", position: "relative", display: "flex", flexDirection: "column", "@media (hover: hover) and (prefers-reduced-motion: no-preference)": { "&:hover .product-image": { transform: "scale(1.025)" } }, "&:hover .product-arrow": { bgcolor: "brand.navy", color: "#fff" }, "&:focus-within": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 5 } }}>
    <Box sx={{ position: "relative", overflow: "hidden", borderRadius: "5px", border: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
      {images.length ? <Box sx={{ aspectRatio: "4 / 3", position: "relative" }}><Box sx={{ position: "absolute", inset: "8% 5% 4%" }}><ProductPhoto className="product-image" images={images} title={ct(product.title)} sizes="(max-width: 600px) calc(100vw - 60px), (max-width: 900px) 45vw, 30vw" /></Box></Box> : <ArtStage height={{ xs: 270, sm: 290 }}><Box sx={{ width: "100%", maxWidth: 330 }}><ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} /></Box></ArtStage>}
      <Typography variant="mono" sx={{ position: "absolute", left: 15, top: 14, fontSize: 9, color: "brand.navy", bgcolor: "rgba(255,255,255,.9)", border: "1px solid", borderColor: "divider", px: 1, py: .5 }}>{ct(meta.code)}</Typography>
      {off ? <Typography component="span" sx={{ position: "absolute", right: 15, top: 14, fontSize: 12, fontWeight: 700, color: "#fff", bgcolor: "brand.navy", borderRadius: "4px", px: 1, py: .25 }}>−{ct(off)}%<Box component="span" sx={visuallyHidden}> {ct("off")}</Box></Typography> : null}
    </Box>
    <Box sx={{ pt: 2.5, pb: 2, flex: 1, display: "flex", flexDirection: "column" }}>
      <ProductBadges metadata={product.metadata} />
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography component="h3" sx={{ fontSize: 23, fontWeight: 500, letterSpacing: "-.04em" }}><Box component={LocalizedNextLink} href={`/products/${product.handle}`} sx={{ textDecoration: "none", "&::after": { content: '\"\"', position: "absolute", inset: 0, zIndex: 2 }, "&:focus-visible": { outline: "none" } }}>{ct(product.title)}</Box></Typography>
        <Box className="product-arrow" aria-hidden sx={{ width: 33, height: 33, flexShrink: 0, border: "1px solid", borderColor: "divider", borderRadius: "50%", display: "grid", placeItems: "center", transition: "background-color .2s, color .2s" }}><Icon name="arrowUpRight" sx={{ fontSize: 16 }} /></Box>
      </Stack>
      <Typography sx={{ color: "brand.blue", fontSize: 11.5, mt: .5 }}>{ct(product.subtitle ?? meta.form)}</Typography>
      <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 1.25, mb: 2 }}>{ct(detail)}</Typography>
      <Stack direction="row" sx={{ mt: "auto", pt: 2, borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 16 }}>{price ? <>{price.hasRange ? <Box component="span" sx={{ color: "text.secondary", fontWeight: 400, fontSize: 11, mr: .5 }}>{ct("From")}</Box> : null}{ct(money(price.amount, price.currencyCode))}{off ? <Box component="span" sx={{ ml: .75, color: "text.secondary", fontWeight: 400, fontSize: 12, textDecoration: "line-through" }}>{ct.rich("<slot0>regular price </slot0>{v0}", { v0: ct(money(price.original, price.currencyCode)) }, { slot0: chunks => <Box component="span" sx={visuallyHidden} key="slot0">{chunks}</Box> })}</Box> : null}</> : "Price on request"}</Typography>
        <StockBadge inStock={inStock} />
      </Stack>
      {meta.notice?.title ? <Typography sx={{ color: "text.secondary", fontSize: 10, mt: 1.5, lineHeight: 1.5 }}>{ct(meta.notice.title)}</Typography> : null}
    </Box>
  </Box>
}
