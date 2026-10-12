"use client"

import type { HttpTypes } from "@medusajs/types"
import NorthEastIcon from "@mui/icons-material/NorthEast"
import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { cheapestPrice, formatMoney, isProductInStock, readProductMeta } from "@/lib/product"
import { LocalizedNextLink } from "../common/links"
import ProductArt from "./ProductArt"

export function ArtStage({ children, height = 210 }: { children: React.ReactNode; height?: number | object }) {
  return (
    <Box
      sx={{
        position: "relative",
        height,
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(145deg,#eaf4f0,#f7faf7)",
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          border: "1px solid #b4d9d2",
          borderRadius: "50%",
          width: "78%",
          height: "48%",
          transform: "rotate(-23deg)",
        },
        "&::after": { width: "92%", height: "66%", transform: "rotate(37deg)", borderColor: "#d1e5df" },
      }}
    >
      {children}
    </Box>
  )
}

export default function ProductCard({ product }: { product: HttpTypes.StoreProduct }) {
  const meta = readProductMeta(product)
  const price = cheapestPrice(product)
  const inStock = isProductInStock(product)
  const category = product.categories?.[0]?.name

  return (
    <Card
      component="article"
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": { transform: "translateY(-5px)", boxShadow: "0 15px 32px #1c405414", borderColor: "#a6d0c8" },
        "&:focus-within": { borderColor: "secondary.main" },
      }}
    >
      {product.thumbnail ? (
        <Box sx={{ position: "relative", height: 210, bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider" }}>
          <Image
            src={product.thumbnail}
            alt=""
            fill
            sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
            style={{ objectFit: "contain", padding: 12 }}
          />
        </Box>
      ) : (
        <ArtStage>
          <Box sx={{ width: "74%", position: "relative", zIndex: 1, transform: "perspective(600px) rotateY(-7deg) rotateZ(-2deg)" }}>
            <ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} />
          </Box>
        </ArtStage>
      )}
      <Stack sx={{ p: 2.75, flex: 1 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", color: "#55807c" }}>
          <Typography variant="eyebrow" noWrap sx={{ fontSize: 11, minWidth: 0 }}>
            {meta.code}
            {category ? ` · ${category}` : ""}
          </Typography>
          <Typography variant="eyebrow" sx={{ fontSize: 11, flexShrink: 0, color: inStock ? "secondary.main" : "error.main" }}>
            {inStock ? "In stock" : "Sold out"}
          </Typography>
        </Stack>
        <Typography variant="h4" component="h3" sx={{ mt: 1.75, mb: 0.75 }}>
          <Box
            component={LocalizedNextLink}
            href={`/products/${product.handle}`}
            sx={{
              color: "inherit",
              textDecoration: "none",
              "&::after": { content: '""', position: "absolute", inset: 0, zIndex: 2 },
              "&:focus-visible": { outline: "none" },
            }}
          >
            {product.title}
          </Box>
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2.5 }}>
          {product.subtitle ?? meta.form}
          {meta.purity ? ` · ${meta.purity}` : ""}
        </Typography>
        <Stack
          direction="row"
          sx={{ mt: "auto", pt: 1.75, borderTop: "1px solid", borderColor: "divider", justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography sx={{ fontWeight: 700 }}>
            {price ? (
              <>
                {price.hasRange ? (
                  <Box component="span" sx={{ color: "text.secondary", fontWeight: 500, fontSize: 13, mr: 0.5 }}>
                    from
                  </Box>
                ) : null}
                {formatMoney(price.amount, price.currencyCode)}
              </>
            ) : (
              "Price on request"
            )}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "secondary.main", fontWeight: 700, fontSize: 13 }}>
            <span>View details</span>
            <NorthEastIcon sx={{ fontSize: 16 }} />
          </Stack>
        </Stack>
      </Stack>
    </Card>
  )
}
