import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { Suspense } from "react"
import { ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import { SerifAccent } from "@/components/common/SectionHeading"
import ProductGrid from "@/components/product/ProductGrid"
import ShopToolbar from "@/components/shop/ShopToolbar"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import {
  listCategories,
  listProducts,
  searchProducts,
  type ProductSort,
} from "@/lib/medusa/products"
import { sortProducts } from "@/lib/product"

export const metadata: Metadata = {
  title: "Shop the collection",
  description: "Explore the Peptide Series with clear specifications and lot-level documentation.",
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name"]

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/[countryCode]/shop">["searchParams"] }) {
  const params = await searchParams
  const query = first(params.q)?.trim() || undefined
  const sortParam = first(params.sort) as ProductSort | undefined
  const sort = sortParam && SORT_VALUES.includes(sortParam) ? sortParam : "featured"

  const { region } = await getCurrentRegion()
  const categories = (await listCategories()).filter((item) => item.handle === "peptide-series")
  const category = categories[0]

  let products = !category
    ? []
    : query
      ? await searchProducts(query, region.id)
      : await listProducts({ regionId: region.id, categoryId: category.id })
  if (query && category) {
    products = products.filter((product) => product.categories?.some((item) => item.id === category.id))
  }
  const sorted = sortProducts(products, sort)

  return (
    <>
      <ShopToolbar
        key={query ?? ""}
        categories={categories.map((item) => ({ handle: item.handle, name: item.name }))}
        category={category?.handle}
        sort={sort}
        query={query}
        count={sorted.length}
      />
      {sorted.length ? (
        <ProductGrid products={sorted} />
      ) : (
        <Stack spacing={2} sx={{ py: 8, alignItems: "center", textAlign: "center" }}>
          <Typography variant="h4" component="p">
            No products match{query ? ` “${query}”` : " this filter"}.
          </Typography>
          <Typography sx={{ color: "text.secondary" }}>
            Try a product code like VTD-01 or a lot number like VTD01-2609A.
          </Typography>
          <ButtonLink href="/shop" variant="outlined">
            Clear filters
          </ButtonLink>
        </Stack>
      )}
    </>
  )
}

function ResultsSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" height={44} sx={{ mb: 3, maxWidth: 420 }} />
      <Grid container spacing={2}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
            <Skeleton variant="rounded" height={380} />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default function ShopPage({ searchParams }: PageProps<"/[countryCode]/shop">) {
  return (
    <>
      <PageHeader
        eyebrow="The collection"
        title={
          <>
            Every sequence, <SerifAccent>documented.</SerifAccent>
          </>
        }
        description="Explore our Peptide Series. Every listing shows its specifications and lot history."
      />
      <Section tone="white" tight>
        <Suspense fallback={<ResultsSkeleton />}>
          <ShopResults searchParams={searchParams} />
        </Suspense>
      </Section>
    </>
  )
}
