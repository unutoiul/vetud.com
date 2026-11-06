import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"
import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { connection } from "next/server"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import { matchesPeptide, researchAvailability, type ResearchAvailability } from "@/lib/learn-products"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { sdk } from "@/lib/medusa/sdk"
import type { HttpTypes } from "@medusajs/types"

const labels: Record<ResearchAvailability, string> = {
  in_stock: "In stock now", available_to_order: "Available to order", out_of_stock: "Out of stock", unavailable: "Availability not confirmed",
}

export default function ResearchCatalog({ peptides }: { peptides: string[] }) {
  const act = useTranslations("Actions")
  return (
    <Box component="section" aria-label={act("relatedProducts")} sx={{ mt: { xs: 5, md: 6 }, p: { xs: 2.5, md: 3.5 }, border: "1px solid", borderColor: "divider", borderRadius: "12px", bgcolor: "brand.paper" }}>
      <Typography component="h2" sx={{ fontSize: 23, fontWeight: 600, letterSpacing: "-.02em" }}>In the research shop</Typography>
      <Typography sx={{ mt: 1, mb: 2.5, fontSize: 14, lineHeight: 1.7, color: "text.secondary", maxWidth: 760 }}>Check the catalog for related laboratory research materials. These products are separate from the approved medicines and clinical trial formulations discussed here.</Typography>
      <Suspense fallback={<><Skeleton height={44} /><Typography sx={{ fontSize: 13, color: "text.secondary" }}>Checking regional availability…</Typography></>}>
        <CurrentProducts peptides={peptides} />
      </Suspense>
    </Box>
  )
}

async function CurrentProducts({ peptides }: { peptides: string[] }) {
  const act = await getTranslations("Actions")
  // Read stock for each visit; never freeze an "in stock now" claim into the article cache.
  await connection()
  const products: HttpTypes.StoreProduct[] = []
  let failed = false
  try {
    const { region } = await getCurrentRegion()
    let count = 0
    do {
      const page = await sdk.store.product.list({
        region_id: region.id, limit: 100, offset: products.length,
        fields: "id,title,handle,+metadata,*variants,*variants.calculated_price,+variants.inventory_quantity",
      })
      products.push(...page.products)
      count = page.count
      if (!page.products.length) break
    } while (products.length < count)
  } catch {
    failed = true
  }
  const related = products.filter((product) => product.handle && peptides.some((slug) => matchesPeptide(product, slug)))
  return (
    <>
      {failed ? <Typography sx={{ mb: 2, color: "text.secondary" }}>We couldn’t check availability right now. Open the shop to check the latest listing.</Typography>
        : related.length ? <Box component="ul" sx={{ p: 0, m: 0, mb: 2, listStyle: "none", display: "grid", gap: 1.5 }}>
          {related.map((product) => {
            const availability = researchAvailability(product)
            return <Box component="li" key={product.id} sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, p: 2, bgcolor: "#fff", borderRadius: "8px", border: "1px solid", borderColor: "divider" }}>
              <AppLink href={`/products/${product.handle}`} sx={{ fontWeight: 600, minHeight: 44, display: "inline-flex", alignItems: "center" }}>{product.title} ↗</AppLink>
              <Typography component="span" sx={{ fontSize: 14, fontWeight: 600, color: availability === "in_stock" ? "success.dark" : "text.secondary" }}>{labels[availability]}</Typography>
            </Box>
          })}
        </Box> : <Typography sx={{ mb: 2, color: "text.secondary" }}>No matching product is currently listed for your region.</Typography>}
      <AppLink href="/shop" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontWeight: 600 }}>{act("shopCatalog")}</AppLink>
      {related.length && !failed ? <Typography sx={{ mt: 1, fontSize: 12.5, color: "text.secondary" }}>Availability checked when this page opened. Individual strengths may differ; the product page shows the latest options.</Typography> : null}
    </>
  )
}
