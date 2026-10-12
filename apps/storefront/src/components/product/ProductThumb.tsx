import Box from "@mui/material/Box"
import Image from "next/image"
import type { ProductMeta } from "@/lib/product"
import ProductArt from "./ProductArt"

type ProductThumbProps = {
  image?: string | null
  meta: ProductMeta
  sizes: string
}

/** The product photo when one is uploaded in Medusa, otherwise the drawn kit-box art. */
export default function ProductThumb({ image, meta, sizes }: ProductThumbProps) {
  if (!image) {
    return <ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} />
  }
  return (
    <Box sx={{ position: "relative", width: "100%", aspectRatio: "1 / 1" }}>
      <Image src={image} alt="" fill sizes={sizes} style={{ objectFit: "contain" }} />
    </Box>
  )
}
