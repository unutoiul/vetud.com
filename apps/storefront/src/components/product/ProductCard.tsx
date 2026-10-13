"use client"

import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "@/components/brand/Icon"
import { cheapestPrice, formatMoney, isProductInStock, readProductMeta } from "@/lib/product"
import { LocalizedNextLink } from "../common/links"
import ProductArt from "./ProductArt"

export function ArtStage({ children, height = 290 }: { children: React.ReactNode; height?: number | object }) {
  return (
    <Box sx={{ position: "relative", height, overflow: "hidden", display: "grid", placeItems: "center",
      background: "radial-gradient(ellipse at 42% 18%, #fff 0%, #f1f6f7 64%, #e9f0f2 100%)",
      "&::after": { content: '\"\"', position: "absolute", left: 0, right: 0, bottom: 0, height: "18%", background: "linear-gradient(180deg, #ffffff00, #dce8eb55)", pointerEvents: "none" },
    }}>{children}</Box>
  )
}

export default function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const meta = readProductMeta(product)
  const price = cheapestPrice(product)
  const inStock = isProductInStock(product)
  const category = product.categories?.[0]?.name

  return (
    <Card component="article" sx={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", p: 0.8,
      borderRadius: 3, bgcolor: "#fff", borderColor: "#e0e8eb", boxShadow: "0 5px 20px #17344b04",
      "&:hover": { transform: "translateY(-3px)", boxShadow: "0 14px 35px #17344b0a", borderColor: "#c3d3da" },
      "&:focus-within": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 3 },
      "@media (prefers-reduced-motion: reduce)": { transition: "none", "&:hover": { transform: "none" } },
    }}>
      <Box sx={{ overflow: "hidden", borderRadius: 2.3 }}>
        {product.thumbnail ? (
          <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "#f1f6f7" }}>
            <Image src={product.thumbnail} alt="" fill sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw" style={{ objectFit: "contain" }} />
          </Box>
        ) : (
          <ArtStage height={{ xs: 270, sm: 290 }}>
            <Box sx={{ width: "100%", maxWidth: 330, position: "relative", zIndex: 1 }}>
              <ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} />
            </Box>
          </ArtStage>
        )}
      </Box>
      <Stack sx={{ px: { xs: 1.8, sm: 2.1 }, pt: 2.5, pb: 1.8, flex: 1 }}>
        <Typography variant="eyebrow" noWrap sx={{ color: "text.secondary", fontSize: 9.5, letterSpacing: ".11em", mb: 1 }}>
          {category ?? "Peptide Series"}
          {` · ${meta.code}`}
        </Typography>
        <Typography variant="h4" component="h3" sx={{ mb: 0.6, fontSize: "1.2rem", lineHeight: 1.3 }}>
          <Box component={LocalizedNextLink} href={`/products/${product.handle}`} sx={{ color: "inherit", textDecoration: "none",
            "&::after": { content: '\"\"', position: "absolute", inset: 0, zIndex: 2, borderRadius: 3 },
            "&:focus-visible": { outline: "none" },
          }}>{product.title}</Box>
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 12.5, mb: 2 }}>
          {product.subtitle ?? meta.form}
          {meta.purity ? ` · ${meta.purity.endsWith("%") ? `${meta.purity} purity` : meta.purity}` : ""}
          {meta.testing ? ` · ${meta.testing}` : ""}
        </Typography>
        <Stack direction="row" sx={{ mt: "auto", pt: 1.75, borderTop: "1px solid #e8edf0", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Stack spacing={0.4}>
            <Typography sx={{ fontWeight: 650, fontSize: 15, color: "text.primary" }}>
              {price ? <>{price.hasRange ? <Box component="span" sx={{ color: "text.secondary", fontWeight: 400, fontSize: 11, mr: 0.5 }}>from</Box> : null}{formatMoney(price.amount, price.currencyCode)}</> : "Price on request"}
            </Typography>
            <Stack direction="row" spacing={0.65} sx={{ alignItems: "center" }}>
              <Box component="span" sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: inStock ? "secondary.main" : "text.secondary" }} />
              <Typography sx={{ fontSize: 10.5, color: "text.secondary" }}>{inStock ? "In stock" : "Sold out"}</Typography>
            </Stack>
          </Stack>
          <Box aria-hidden="true" sx={{ width: 34, height: 34, display: "grid", placeItems: "center", borderRadius: "50%", border: "1px solid #dbe5e9", color: "primary.main" }}>
            <Icon name="arrowUpRight" sx={{ fontSize: 16 }} />
          </Box>
        </Stack>
      </Stack>
    </Card>
  )
}
