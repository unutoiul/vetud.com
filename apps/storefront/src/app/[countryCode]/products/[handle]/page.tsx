import Box from "@mui/material/Box"
import Breadcrumbs from "@mui/material/Breadcrumbs"
import Chip from "@mui/material/Chip"
import Grid from "@mui/material/Grid"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import ProductArt from "@/components/product/ProductArt"
import { ArtStage } from "@/components/product/ProductCard"
import ProductGrid from "@/components/product/ProductGrid"
import ProductTabs from "@/components/product/ProductTabs"
import PurchasePanel from "@/components/product/PurchasePanel"
import { BASE_URL } from "@/lib/config"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { getProductByHandle, listProductHandles, listProducts } from "@/lib/medusa/products"
import { cheapestPrice, isProductInStock, readProductMeta, sortedVariants, sortProducts } from "@/lib/product"

const PLACEHOLDER = "__placeholder__"

export async function generateStaticParams() {
  try {
    const handles = await listProductHandles()
    return handles.length ? handles.map((handle) => ({ handle })) : [{ handle: PLACEHOLDER }]
  } catch {
    // Backend unreachable at build time: pages render on first request instead.
    return [{ handle: PLACEHOLDER }]
  }
}

async function loadProduct(handle: string) {
  if (handle === PLACEHOLDER) return { product: null, region: null, countryCode: "" }
  const { region, countryCode } = await getCurrentRegion()
  const product = await getProductByHandle(handle, region.id)
  return { product, region, countryCode }
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/products/[handle]">): Promise<Metadata> {
  const { handle } = await params
  const { product } = await loadProduct(handle)
  if (!product) return { title: "Product not found" }
  const meta = readProductMeta(product)
  return {
    title: `${product.title} (${meta.code})`,
    description: `${product.subtitle ?? "Research material"}. ${meta.purity ?? ""} ${meta.form ?? ""}. Lot-documented, for laboratory research use only.`.replace(/\s+/g, " "),
  }
}

function ProductSkeleton() {
  return (
    <Section tone="white" tight>
      <Grid container spacing={{ xs: 4, md: 8 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton variant="rounded" height={520} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Skeleton width="30%" />
          <Skeleton variant="text" sx={{ fontSize: 56 }} />
          <Skeleton width="60%" />
          <Skeleton variant="rounded" height={220} sx={{ mt: 3 }} />
        </Grid>
      </Grid>
    </Section>
  )
}

// Params are read inside Suspense so handles added after the build get an instant shell.
export default function ProductPage({ params }: PageProps<"/[countryCode]/products/[handle]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  )
}

async function ProductContent({ params }: Pick<PageProps<"/[countryCode]/products/[handle]">, "params">) {
  const { handle } = await params
  const { product, region, countryCode } = await loadProduct(handle)
  if (!product || !region) notFound()

  const meta = readProductMeta(product)
  const category = product.categories?.[0]
  const related = sortProducts(await listProducts({ regionId: region.id, categoryId: category?.id }), "featured")
    .filter((item) => item.id !== product.id)
    .slice(0, 3)

  const skus = sortedVariants(product)
    .map((variant) => variant.sku)
    .filter(Boolean)
    .join(", ")
  const specs = [
    { label: "Product code", value: meta.code },
    { label: "Category", value: category?.name ?? "Research material" },
    { label: "Form", value: meta.form ?? "—" },
    { label: "Purity", value: meta.purity ?? "—" },
    { label: "Storage", value: meta.storage ?? "—" },
    { label: "Available amounts", value: sortedVariants(product).map((variant) => variant.title).join(", ") },
    ...(skus ? [{ label: "SKU", value: skus }] : []),
    { label: "Intended use", value: "Laboratory research only" },
  ]

  const price = cheapestPrice(product)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: meta.code,
    description: product.description ?? undefined,
    brand: { "@type": "Brand", name: "Vetud Peptides" },
    url: `${BASE_URL}/${countryCode}/products/${product.handle}`,
    ...(price
      ? {
          offers: {
            "@type": "Offer",
            price: price.amount,
            priceCurrency: price.currencyCode.toUpperCase(),
            availability: isProductInStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  }
  const image = product.images?.[0]?.url ?? product.thumbnail

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Section tone="white" tight sx={{ pt: { xs: 3, md: 4 } }}>
        <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: { xs: 3, md: 4 }, fontSize: 14 }}>
          <AppLink href="/shop" color="inherit">
            Shop
          </AppLink>
          {category ? (
            <AppLink href={`/shop?category=${category.handle}`} color="inherit">
              {category.name}
            </AppLink>
          ) : null}
          <Typography sx={{ fontSize: 14, color: "text.primary" }} aria-current="page">
            {product.title}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 110 }, border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
              {image ? (
                <Box sx={{ position: "relative", aspectRatio: "1 / 1", bgcolor: "brand.mintWash" }}>
                  <Image src={image} alt={product.title} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "contain" }} priority />
                </Box>
              ) : (
                <ArtStage height={{ xs: 320, sm: 420, md: 520 }}>
                  <Box sx={{ width: "78%", position: "relative", zIndex: 1, transform: "rotate(-5deg)" }}>
                    <ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} title={`${product.title} kit box`} />
                  </Box>
                </ArtStage>
              )}
              <Stack direction="row" spacing={1} useFlexGap sx={{ p: 2, flexWrap: "wrap", borderTop: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
                {[meta.purity, meta.form, meta.lots.length ? `${meta.lots.length} documented lot${meta.lots.length > 1 ? "s" : ""}` : null]
                  .filter(Boolean)
                  .map((label) => (
                    <Chip key={label} label={label} size="small" variant="outlined" />
                  ))}
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
              {meta.code}
              {category ? ` · ${category.name}` : ""}
            </Typography>
            <Typography variant="h2" component="h1" sx={{ mt: 1.25, mb: 1 }}>
              {product.title}
            </Typography>
            {product.subtitle ? (
              <Typography variant="lead" sx={{ color: "text.secondary", mb: 3 }}>
                {product.subtitle}
              </Typography>
            ) : null}
            <PurchasePanel product={product} />
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 6, md: 9 } }}>
          <ProductTabs description={product.description} specs={specs} lots={meta.lots} productTitle={product.title} />
        </Box>
      </Section>

      {related.length ? (
        <Section tone="paper">
          <SectionHeading eyebrow="Related" title="From the same series." />
          <ProductGrid products={related} />
        </Section>
      ) : null}
    </>
  )
}
