import type { Metadata } from "next"
import type { HttpTypes } from "@medusajs/types"
import { BASE_URL, SITE, SUPPORTED_COUNTRIES } from "@/lib/config"
import { getProductImages } from "@/lib/product-images"
import { isVariantInStock, readProductMeta, variantPrice } from "@/lib/product"
import { defaultVariant } from "@/lib/product-formats"
import { getCountryRules } from "@/i18n/config"
import { getPageLocalization } from "@/i18n/metadata"

export const storefrontUrl = (country: string, path = "") => `${BASE_URL}/${country}${path}`

export function storefrontLanguages(path: string) {
  return Object.fromEntries([
    ...SUPPORTED_COUNTRIES.map(country => [getCountryRules(country).locale, storefrontUrl(country, path)]),
    ["x-default", storefrontUrl("us", path)],
  ])
}

export async function storefrontMetadata({ title, description, country, path, images = [], noindex = false }: {
  title: string; description: string; country: string; path: string;
  images?: { url: string; alt?: string }[]; noindex?: boolean
}): Promise<Metadata> {
  const { ct, openGraphLocale } = await getPageLocalization()
  title = ct(title)
  description = ct(description)
  images = images.map(image => ({ ...image, alt: ct(image.alt) }))
  const url = storefrontUrl(country, path)
  return {
    title: { absolute: title }, description,
    alternates: { canonical: url, ...(!noindex ? { languages: storefrontLanguages(path) } : {}) },
    openGraph: { type: "website", siteName: "VETUD", title, description, url,
      locale: openGraphLocale, images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images: images.map(image => image.url) },
    robots: { index: !noindex, follow: true, googleBot: { index: !noindex, follow: true, "max-image-preview": "large" } },
  }
}

export async function productMetadata(product: HttpTypes.StoreProduct, country: string): Promise<Metadata> {
  const { ct } = await getPageLocalization()
  const meta = readProductMeta(product)
  const form = meta.form && !product.title.toLowerCase().includes(meta.form.replace(/ solution$/i, "").toLowerCase()) ? ` ${ct(meta.form)}` : ""
  const market = country === "gb" ? "UK" : country.toUpperCase()
  return storefrontMetadata({
    title: ct.template("{v0}{v1} for Research | VETUD {v2}", { v0: ct(product.title), v1: form, v2: market }, { translateValues: false }),
    description: ct.template("{v0}{v1}. Available amounts, regional prices, stock and lot documentation. Laboratory research only; not for human use.", { v0: ct(product.title), v1: form }, { translateValues: false }),
    country, path: `/products/${product.handle}`,
    images: getProductImages(product).map(image => ({ ...image, url: new URL(image.url, BASE_URL).href })),
  })
}

/** Describe the same initially selected variant and price as PurchasePanel. */
export async function productStructuredData(product: HttpTypes.StoreProduct, country: string) {
  const { ct, locale } = await getPageLocalization()
  const url = storefrontUrl(country, `/products/${product.handle}`)
  const variant = defaultVariant(product)
  const price = variantPrice(variant)
  const meta = readProductMeta(product)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product", "@id": `${url}#product`, url, name: ct(product.title), inLanguage: locale,
        sku: variant?.sku ?? undefined,
        description: ct(product.description ?? `${product.title}. Laboratory research use only.`),
        brand: { "@type": "Brand", name: "VETUD" },
        image: getProductImages(product).map(image => new URL(image.url, BASE_URL).href),
        ...(meta.form ? { additionalProperty: [{ "@type": "PropertyValue", name: ct("Form"), value: ct(meta.form) }] } : {}),
        ...(price && Number.isFinite(price.amount) && price.amount >= 0 ? {
          offers: {
            "@type": "Offer", url, name: ct(variant.title), sku: variant.sku ?? undefined,
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
          { "@type": "ListItem", position: 1, name: ct("Shop"), item: storefrontUrl(country, "/shop") },
          ...(product.categories?.[0] ? [{ "@type": "ListItem", position: 2, name: ct(product.categories[0].name), item: `${storefrontUrl(country, "/shop")}?category=${encodeURIComponent(product.categories[0].handle)}` }] : []),
          { "@type": "ListItem", position: product.categories?.[0] ? 3 : 2, name: ct(product.title), item: url },
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

export function localizedWebsiteStructuredData(locale: string) {
  return { ...websiteStructuredData, "@graph": websiteStructuredData["@graph"].map(item => item["@type"] === "WebSite" ? { ...item, inLanguage: locale } : item) }
}
