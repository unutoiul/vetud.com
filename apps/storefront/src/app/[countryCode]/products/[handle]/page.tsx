import { getContentTranslator } from "@/i18n/server-content"
import { getTranslations } from "next-intl/server"
import type { HttpTypes } from "@medusajs/types"
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
import ProductLearnMore from "@/components/product/ProductLearnMore"
import DualChamberExplainer from "@/components/product/DualChamberExplainer"
import { ProductSelectionProvider } from "@/components/product/ProductSelection"
import { getProductGuides, getProductOverview } from "@/content/product-overview"
import PurchasePanel, { type PurchaseAddOn } from "@/components/product/PurchasePanel"
import { productMetadata, productStructuredData } from "@/lib/storefront-seo"
import { getCurrentRegion } from "@/lib/medusa/current-region"
import { getLotReportCounts } from "@/lib/medusa/forum"
import { getProductByHandle, listProductHandles, listProducts } from "@/lib/medusa/products"
import { getMoney } from "@/lib/money-server"
import { isVariantInStock, readProductMeta, sortedVariants, sortProducts, variantPrice } from "@/lib/product"
import { availabilitySummary, boxedFormat, defaultVariant, FORMAT_OPTION, formatContents, formatOf, hasFormats, readOptions, SPRAY_FORMAT, variantsWith } from "@/lib/product-formats"
import { getFormatPhotos, getProductImages, getProductPhotography } from "@/lib/product-images"

const PLACEHOLDER = "__placeholder__"

/** Supplies offered next to the vial format; they aren't offered on their own pages. */
const ADD_ON_HANDLES = ["bacteriostatic-water", "u-100-syringes"]

function addOn(product: HttpTypes.StoreProduct | null, variantTitle: string | undefined, title: string, detail: string, unit: string): PurchaseAddOn | null {
  const variants = product ? sortedVariants(product) : []
  const variant = variants.find((item) => item.title === variantTitle) ?? (variantTitle ? undefined : variants[0])
  const price = variantPrice(variant)
  if (!product || !variant || !price || !isVariantInStock(variant)) return null
  return { variantId: variant.id, title, detail, unit, image: getProductImages(product).find((image) => image.url.includes("vial") || image.url.includes("box"))?.url ?? getProductImages(product)[0]?.url, price: { amount: price.amount, currencyCode: price.currencyCode } }
}

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
  const { product, countryCode } = await loadProduct(handle)
  if (!product) return { title: "Product not found", robots: { index: false, follow: true } }
  return productMetadata(product, countryCode)
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
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  const { handle } = await params
  const [{ product, region, countryCode }, money] = await Promise.all([loadProduct(handle), getMoney()])
  if (!product || !region) notFound()

  const meta = readProductMeta(product)
  const lotReports = meta.lots.length ? await getLotReportCounts(meta.lots.map(lot => lot.lot)).catch(() => undefined) : undefined
  const category = product.categories?.[0]
  const [catalog, water, syringes] = await Promise.all([
    listProducts({ regionId: region.id, categoryId: category?.id }),
    ADD_ON_HANDLES.includes(handle) ? null : getProductByHandle("bacteriostatic-water", region.id),
    ADD_ON_HANDLES.includes(handle) ? null : getProductByHandle("u-100-syringes", region.id),
  ])
  const addOns = [addOn(water, "Vial · 10 ml", "Bacteriostatic water", "10 ml multi-use vial", "vial"), addOn(syringes, undefined, "U-100 insulin syringes", "Box of 10, single use", "box")].filter((item): item is PurchaseAddOn => item !== null)
  const related = sortProducts(catalog, "featured")
    .filter((item) => item.id !== product.id)
    .slice(0, 3)

  const skus = sortedVariants(product)
    .map((variant) => variant.sku)
    .filter(Boolean)
    .join(", ")
  const formats = readOptions(product).find((option) => option.title === FORMAT_OPTION)?.values ?? []
  // "Pen kit box", or "Nasal spray" for Selank and Semax.
  const boxed = boxedFormat(product)
  const included = formats.flatMap((format) => {
    const contents = formatContents(product, format)
    return contents ? [{ format, contents }] : []
  })
  // "From" prices per format for the pen-vs-vial comparison.
  const fromPrice = (format: string) => {
    const amounts = variantsWith(product, FORMAT_OPTION, format).flatMap((variant) => variantPrice(variant)?.amount ?? [])
    return amounts.length ? money(Math.min(...amounts), region.currency_code) : undefined
  }
  // Products sold in both formats get a short table: what's included and storage have their own sections.
  const specs = formats.length ? [
    { label: "Product code", value: meta.code },
    { label: "Category", value: category?.name ?? "Research material" },
    ...formats.map((format) => ({ label: format, value: variantsWith(product, FORMAT_OPTION, format).map((variant) => variant.options?.find((option) => option.option?.title === "Amount")?.value ?? variant.title).join(", ") })),
    ...(meta.purity ? [{ label: "Purity", value: meta.purity }] : []),
    ...(meta.testing ? [{ label: "Purity testing", value: meta.testing }] : []),
    { label: "Intended use", value: "Laboratory research only" },
  ] : [
    { label: "Product code", value: meta.code },
    { label: "Category", value: category?.name ?? "Research material" },
    { label: "Form", value: meta.form ?? "—" },
    ...(typeof product.metadata?.contents === "string" ? [{ label: "Kit contents", value: product.metadata.contents }] : []),
    ...included.map(({ format, contents }) => ({ label: `${format}: what's included`, value: contents })),
    ...(meta.volume ? [{ label: "Bottle volume", value: meta.volume }] : []),
    ...(meta.concentration ? [{ label: "Peptide strength", value: meta.concentration }] : []),
    ...(meta.ingredients ? [{ label: "Ingredient information", value: meta.ingredients }] : []),
    { label: "Purity", value: meta.purity ?? "—" },
    ...(meta.testing ? [{ label: "Purity testing", value: meta.testing }] : []),
    { label: "Storage", value: meta.storage ?? "—" },
    ...(meta.stability ? [{ label: "Stability", value: meta.stability }] : []),
    ...(meta.handling ? [{ label: "Handling", value: meta.handling }] : []),
    { label: formats.length ? "Formats and amounts" : "Available amounts", value: availabilitySummary(product) },
    ...(skus ? [{ label: "SKU", value: skus }] : []),
    { label: "Intended use", value: "Laboratory research only" },
  ]
  const overview = getProductOverview(product)

  const images = getProductImages(product)
  const jsonLd = await productStructuredData(product, countryCode)
  const guides = getProductGuides(product)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <Section tone="white" tight sx={{ pt: { xs: 3, md: 4 } }}>
        <Breadcrumbs aria-label={act("breadcrumb")} sx={{ mb: { xs: 3, md: 4 }, fontSize: 14 }}>
          <AppLink href="/shop" color="inherit">
            {act("shop")}
          </AppLink>
          {category ? (
            <AppLink href={`/shop?category=${category.handle}`} color="inherit">
              {ct(category.name)}
            </AppLink>
          ) : null}
          <Typography sx={{ fontSize: 14, color: "text.primary" }} aria-current="page">
            {ct(product.title)}
          </Typography>
        </Breadcrumbs>

        <ProductSelectionProvider initialFormat={formatOf(defaultVariant(product))}>
        <Grid container spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ position: { md: "sticky" }, top: { md: 110 }, border: "1px solid", borderColor: "divider", borderRadius: "5px", overflow: "hidden" }}>
              {images.length ? (
                <ProductGallery title={ct(product.title)} images={images} aspectRatio={getProductPhotography(product.handle)?.aspectRatio ?? meta.imageAspectRatio ?? "4 / 3"} />
              ) : (
                <ArtStage height={{ xs: 320, sm: 420, md: 520 }}>
                  <Box sx={{ width: "90%", maxWidth: 500, position: "relative", zIndex: 1 }}>
                    <ProductArt code={meta.code} accent={meta.accent} kind={meta.artKind} title={ct.template("{v0} product image", { v0: product.title })} />
                  </Box>
                </ArtStage>
              )}
              <Stack direction="row" spacing={1} useFlexGap sx={{ p: 2, flexWrap: "wrap", borderTop: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
                {[meta.purity?.endsWith("%") ? `${meta.purity} purity` : meta.purity, meta.testing, ...meta.features, meta.lots.length ? `${meta.lots.length} documented lot${meta.lots.length > 1 ? "s" : ""}` : null]
                  .filter(Boolean)
                  .map((label) => (
                    <Chip key={label} label={ct(label)} size="small" variant="outlined" />
                  ))}
              </Stack>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="mono" component="p" sx={{ color: "brand.blue", fontSize: 10, letterSpacing: ".1em" }}>
              {ct(meta.code)}
              {ct(category ? ` · ${category.name}` : "")}
            </Typography>
            <Typography variant="h2" component="h1" sx={{ mt: 1.75, mb: 1.5, fontWeight: 400, fontSize: { xs: 40, md: 52 } }}>
              {ct(product.title)}
            </Typography>
            {product.subtitle ? (
              <Typography variant="lead" sx={{ color: "text.secondary", mb: 3 }}>
                {ct(product.subtitle)}
              </Typography>
            ) : null}
            <PurchasePanel product={product} addOns={addOns} />
          </Grid>
        </Grid>
        </ProductSelectionProvider>

        <Box>
          <ProductDossier overview={overview} skus={formats.length ? skus : undefined} description={ct(product.description)} specs={specs} meta={meta} title={ct(product.title)} lotReports={lotReports} formats={hasFormats(product) ? <DualChamberExplainer prices={{ pen: fromPrice("Dual-chamber vial") ?? fromPrice("Dual-chamber pen"), box: boxed ? fromPrice(boxed) : undefined, vial: fromPrice("Vial") }} photos={getFormatPhotos(product.handle)} supply={meta.artKind === "supply"} spray={boxed === SPRAY_FORMAT} /> : undefined} formatsLabel={boxed === SPRAY_FORMAT ? "Vial, dual-chamber or nasal spray" : undefined} currencyCode={region.currency_code} freeShippingThreshold={typeof region.metadata?.free_shipping_threshold === "number" ? region.metadata.free_shipping_threshold : undefined} />
        </Box>
      </Section>

      {related.length ? (
        <Section tone="paper">
          <SectionHeading eyebrow={ct("Related")} title={ct("From the same series.")} />
          <ProductGrid products={related} />
        </Section>
      ) : null}

      {/* Supplies without a library guide (water, syringes) don't need a reading list. */}
      {guides.length || meta.artKind !== "supply" ? <ProductLearnMore title={ct(product.title)} guides={guides} /> : null}
    </>
  )
}
