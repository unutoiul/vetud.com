import type { HttpTypes } from "@medusajs/types"
import Grid from "@mui/material/Grid"
import ProductCard from "./ProductCard"

type ProductGridProps = {
  products: HttpTypes.StoreProduct[]
  /** "four" fits four cards per row on wide screens (home page featured row). */
  density?: "three" | "four"
}

export default function ProductGrid({ products, density = "three" }: ProductGridProps) {
  const size = density === "four" ? { xs: 12, sm: 6, lg: 3 } : { xs: 12, sm: 6, md: 4 }
  return (
    <Grid container spacing={{ xs: 2, md: 2.5 }}>
      {products.map((product) => (
        <Grid key={product.id} size={size}>
          <ProductCard product={product} />
        </Grid>
      ))}
    </Grid>
  )
}
