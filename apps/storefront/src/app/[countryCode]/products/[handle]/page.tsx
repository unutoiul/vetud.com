import Box from "@mui/material/Box"
import Breadcrumbs from "@mui/material/Breadcrumbs"
import Chip from "@mui/material/Chip"
import Grid from "@mui/material/Grid"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import SectionHeading from "@/components/common/SectionHeading"
import ProductArt from "@/components/product/ProductArt"
import { ArtStage } from "@/components/product/ProductCard"
import ProductGrid from "@/components/product/ProductGrid"
import ProductGallery from "@/components/product/ProductGallery"
import ProductDossier from "@/components/product/ProductDossier"
import { getProductResearch } from "@/content/product-research"
import PurchasePanel from "@/components/product/PurchasePanel"
import { BASE_URL } from "@/lib/config"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { getProductByHandle, listProductHandles, listProducts } from "@/lib/medusa/products"
import { cheapestPrice, isProductInStock, readProductMeta, sortedVariants, sortProducts } from "@/lib/product"
import { getProductImages, getProductPhotography } from "@/lib/product-images"

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
  const profile = getProductResearch(handle)
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
    ...(typeof product.metadata?.contents === "string" ? [{ label: "Kit contents", value: product.metadata.contents }] : []),
    ...(meta.volume ? [{ label: "Bottle volume", value: meta.volume }] : []),
    ...(meta.concentration ? [{ label: "Peptide strength", value: meta.concentration }] : []),
    ...(meta.ingredients ? [{ label: "Ingredient information", value: meta.ingredients }] : []),
    { label: "Purity", value: meta.purity ?? "—" },
    ...(meta.testing ? [{ label: "Purity testing", value: meta.testing }] : []),
    { label: "Storage", value: meta.storage ?? "—" },
    ...(meta.stability ? [{ label: "Stability", value: meta.stability }] : []),
    ...(meta.handling ? [{ label: "Handling", value: meta.handling }] : []),
    { label: "Available amounts", value: sortedVariants(product).map((variant) => variant.title).join(", ") },
    ...(skus ? [{ label: "SKU", value: skus }] : []),
    { label: "Intended use", value: "Laboratory research only" },
  ]

  const price = cheapestPrice(product)
  const images = getProductImages(product)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    sku: meta.code,
    description: product.description ?? undefined,
    brand: { "@type": "Brand", name: "Vetud Peptides" },
    url: `${BASE_URL}/${countryCode}/products/${product.handle}`,
    image: images.map(image => new URL(image.url, BASE_URL).href),
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
            <Box sx={{ position: { md: "sticky" }, top: { md: 110 }, border: "1px solid", borderColor: "divider", borderRadius: "5px", overflow: "hidden" }}>
              {images.length ? (
                <ProductGallery title={product.title} images={images} aspectRatio={getProductPhotography(product.handle)?.aspectRatio ?? meta.imageAspectRatio ?? "4 / 3"} />
              ) : (
                <ArtStage height={{ xs: 320, sm: 420, md: 520 }}>
                  <Box sx={{ width: "90%", maxWidth: 500, position: "relative", zIndex: 1 }}>
                    <ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} title={`${product.title} product image`} />
                  </Box>
                </ArtStage>
              )}
              <Stack direction="row" spacing={1} useFlexGap sx={{ p: 2, flexWrap: "wrap", borderTop: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
                {[meta.purity?.endsWith("%") ? `${meta.purity} purity` : meta.purity, meta.testing, ...meta.features, meta.lots.length ? `${meta.lots.length} documented lot${meta.lots.length > 1 ? "s" : ""}` : null]
                  .filter(Boolean)
                  .map((label) => (
                    <Chip key={label} label={label} size="small" variant="outlined" />
                  ))}
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10, letterSpacing: ".1em" }}>
              {meta.code}
              {category ? ` · ${category.name}` : ""}
            </Typography>
            <Typography variant="h2" component="h1" sx={{ mt: 1.75, mb: 1.5, fontWeight: 400, fontSize: { xs: 40, md: 52 } }}>
              {product.title}
            </Typography>
            {profile || product.subtitle ? (
              <Typography variant="lead" sx={{ color: "text.secondary", mb: 3 }}>
                {profile?.summary ?? product.subtitle}
              </Typography>
            ) : null}
            <PurchasePanel product={product} />
            <Box sx={{ mt: 3.5, borderTop: "1px solid", borderColor: "divider", "& details": { borderBottom: "1px solid", borderColor: "divider", py: 1.75 }, "& summary": { cursor: "pointer", fontSize: 12, fontWeight: 600 }, "& details p": { mt: 1.25, color: "text.secondary", fontSize: 12, lineHeight: 1.8 } }}>
              <details><summary>Quality & documentation</summary><Typography>Listed purity: {meta.purity ?? "see batch documentation"}. Match any certificate to the lot printed on your product. <AppLink href="#quality">View documentation</AppLink>.</Typography></details>
              <details><summary>Storage & stability</summary><Typography>{meta.storage ?? "Follow the conditions on your batch label."} {meta.stability}</Typography></details>
              <details><summary>What is included?</summary><Typography>{typeof product.metadata?.contents === "string" ? product.metadata.contents : `${product.title} in the selected format and amount. Refer to the specifications below for composition.`}{product.metadata?.image_packaging_amount ? ` Images show ${product.metadata.image_packaging_amount} packaging; your selected amount determines the supplied product.` : ""}</Typography></details>
            </Box>
          </Grid>
        </Grid>

        <Box>
          <ProductDossier profile={profile} description={product.description} specs={specs} meta={meta} title={product.title} currencyCode={region.currency_code} freeShippingThreshold={typeof region.metadata?.free_shipping_threshold === "number" ? region.metadata.free_shipping_threshold : undefined} />
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
