import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { Suspense } from "react"
import { ButtonLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import PageHeader from "@/components/common/PageHeader"
import ProductGrid from "@/components/product/ProductGrid"
import ShopToolbar from "@/components/shop/ShopToolbar"
import CategoryFilters from "@/components/shop/CategoryFilters"
import { categoryFacets, filterByCategories } from "@/lib/catalog-filters"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import {
  listCategories,
  listCatalogProducts,
  searchProducts,
  type ProductSort,
} from "@/lib/medusa/products"
import { sortProducts } from "@/lib/product"

export const metadata: Metadata = {
  title: "Shop the collection",
  description: "Explore the complete collection with clear specifications and lot-level documentation.",
}

const SORT_VALUES: ProductSort[] = ["featured", "price-asc", "price-desc", "name"]

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

async function ShopResults({ searchParams }: { searchParams: PageProps<"/[countryCode]/shop">["searchParams"] }) {
  const params = await searchParams
  const query = first(params.q)?.trim() || undefined
  const selectedCategories = [...new Set((Array.isArray(params.category) ? params.category : params.category ? [params.category] : []).filter(Boolean))]
  const sortParam = first(params.sort) as ProductSort | undefined
  const sort = sortParam && SORT_VALUES.includes(sortParam) ? sortParam : "featured"

  const { region } = await getCurrentRegion()
  const [categories, catalog, matches] = await Promise.all([
    listCategories(),
    listCatalogProducts(region.id),
    query ? searchProducts(query, region.id) : Promise.resolve(null),
  ])
  const facets = categoryFacets(categories, catalog)
  const sorted = sortProducts(filterByCategories(matches ?? catalog, facets, selectedCategories), sort)

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "256px minmax(0, 1fr)" }, alignItems: "start", gap: { xs: 2.5, lg: 5 } }}>
      <CategoryFilters categories={facets} selected={selectedCategories} query={query} sort={sort} />
      <Box sx={{ minWidth: 0 }}>
      <ShopToolbar
        key={query ?? ""}
        categories={facets}
        selectedCategories={selectedCategories}
        sort={sort}
        query={query}
        count={sorted.length}
      />
      {sorted.length ? (
        <ProductGrid products={sorted} />
      ) : (
        <Stack spacing={2} sx={{ py: 8, alignItems: "center", textAlign: "center" }}>
          {query || selectedCategories.length ? (
            <>
              <Typography variant="h4" component="p">
                {query ? `No products match “${query}”.` : "No products in these categories yet."}
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>
                {query ? "Try another search or remove a category filter." : "Choose another research area or browse the full collection."}
              </Typography>
              <ButtonLink href="/shop" variant="outlined">
                Clear filters
              </ButtonLink>
            </>
          ) : (
            <>
              <Typography variant="h4" component="p">
                Our catalog is being updated.
              </Typography>
              <Typography sx={{ color: "text.secondary" }}>
                Contact us for availability of research materials.
              </Typography>
              <ButtonLink href="/contact" variant="outlined">
                Contact us
              </ButtonLink>
            </>
          )}
        </Stack>
      )}
      </Box>
    </Box>
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
      <PageHeader eyebrow="The collection" title="A precise place to begin." description="Explore research peptides by research area, product type and available amount. Every product brings its specifications and research context into focus." />
      <Section tone="white" tight sx={{ pt: { xs: 3, md: 5 } }}>
        <Suspense fallback={<ResultsSkeleton />}>
          <ShopResults searchParams={searchParams} />
        </Suspense>
      </Section>
    </>
  )
}
