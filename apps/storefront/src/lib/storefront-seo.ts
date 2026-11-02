import type { Metadata } from "next"
import type { HttpTypes } from "@medusajs/types"
import { BASE_URL, SITE, SUPPORTED_COUNTRIES } from "@/lib/config"
import { getProductImages } from "@/lib/product-images"
import { initialProductVariant, isVariantInStock, readProductMeta, variantPrice } from "@/lib/product"

export const storefrontUrl = (country: string, path = "") => `${BASE_URL}/${country}${path}`

export function storefrontLanguages(path: string) {
  return Object.fromEntries([
    ...SUPPORTED_COUNTRIES.map(country => [`en-${country.toUpperCase()}`, storefrontUrl(country, path)]),
    ["x-default", storefrontUrl("us", path)],
  ])
}

export function storefrontMetadata({ title, description, country, path, images = [], noindex = false }: {
  title: string; description: string; country: string; path: string;
  images?: { url: string; alt?: string }[]; noindex?: boolean
}): Metadata {
  const url = storefrontUrl(country, path)
  return {
    title: { absolute: title }, description,
    alternates: { canonical: url, ...(!noindex ? { languages: storefrontLanguages(path) } : {}) },
    openGraph: { type: "website", siteName: "VETUD", title, description, url,
      locale: `en_${country.toUpperCase()}`, images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images: images.map(image => image.url) },
    robots: { index: !noindex, follow: true, googleBot: { index: !noindex, follow: true, "max-image-preview": "large" } },
  }
}

export function productMetadata(product: HttpTypes.StoreProduct, country: string): Metadata {
  const meta = readProductMeta(product)
  const form = meta.form && !product.title.toLowerCase().includes(meta.form.replace(/ solution$/i, "").toLowerCase()) ? ` ${meta.form}` : ""
  const market = country === "gb" ? "UK" : country.toUpperCase()
  return storefrontMetadata({
    title: `${product.title}${form} for Research | VETUD ${market}`,
    description: `${product.title}${form}. Available amounts, regional prices, stock and lot documentation. Laboratory research only; not for human use.`,
    country, path: `/products/${product.handle}`,
    images: getProductImages(product).map(image => ({ ...image, url: new URL(image.url, BASE_URL).href })),
  })
}

/** Describe the same initially selected variant and price as PurchasePanel. */
export function productStructuredData(product: HttpTypes.StoreProduct, country: string) {
  const url = storefrontUrl(country, `/products/${product.handle}`)
  const variant = initialProductVariant(product)
  const price = variantPrice(variant)
  const meta = readProductMeta(product)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product", "@id": `${url}#product`, url, name: product.title,
        sku: variant?.sku ?? undefined,
        description: product.description ?? `${product.title}. Laboratory research use only.`,
        brand: { "@type": "Brand", name: "VETUD" },
        image: getProductImages(product).map(image => new URL(image.url, BASE_URL).href),
        ...(meta.form ? { additionalProperty: [{ "@type": "PropertyValue", name: "Form", value: meta.form }] } : {}),
        ...(price && Number.isFinite(price.amount) && price.amount >= 0 ? {
          offers: {
            "@type": "Offer", url, name: variant.title, sku: variant.sku ?? undefined,
            price: price.amount, priceCurrency: price.currencyCode.toUpperCase(),
            availability: !isVariantInStock(variant) ? "https://schema.org/OutOfStock"
              : variant.manage_inventory && (variant.inventory_quantity ?? 0) <= 0 && variant.allow_backorder
                ? "https://schema.org/BackOrder" : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: "VETUD", url: BASE_URL },
          },
        } : {}),
      },
      {
        "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Shop", item: storefrontUrl(country, "/shop") },
          ...(product.categories?.[0] ? [{ "@type": "ListItem", position: 2, name: product.categories[0].name, item: `${storefrontUrl(country, "/shop")}?category=${encodeURIComponent(product.categories[0].handle)}` }] : []),
          { "@type": "ListItem", position: product.categories?.[0] ? 3 : 2, name: product.title, item: url },
        ],
      },
    ],
  }
}

export const websiteStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${BASE_URL}/#website`, url: BASE_URL, name: "VETUD", alternateName: "VETUD Peptides Education", inLanguage: "en", publisher: { "@id": `${BASE_URL}/#organization` } },
    { "@type": "Organization", "@id": `${BASE_URL}/#organization`, name: "VETUD", url: BASE_URL, email: SITE.email, logo: `${BASE_URL}/brand/vetud-logo.svg` },
  ],
}
