import Box from "@mui/material/Box"
import Image from "next/image"
import type { ProductMeta } from "@/lib/product"
import { getProductThumbnail } from "@/lib/product-images"
import ProductArt from "./ProductArt"

type ProductThumbProps = {
  image?: string | null
  handle?: string | null
  meta: ProductMeta
  sizes: string
}

/** Resolve the same approved photograph used on the product page, including older carts. */
export default function ProductThumb({ image: fallback, handle, meta, sizes }: ProductThumbProps) {
  const image = getProductThumbnail(handle, fallback)
  if (!image) {
    return <ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} />
  }
  return (
    <Box sx={{ position: "relative", width: "100%", aspectRatio: "1 / 1", bgcolor: "#fff", borderRadius: 1, overflow: "hidden" }}>
      <Image src={image} alt="" fill loading="lazy" sizes={sizes} style={{ objectFit: "contain" }} />
    </Box>
  )
}
