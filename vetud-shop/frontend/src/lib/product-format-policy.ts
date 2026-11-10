import type { HttpTypes } from "@medusajs/types"

/** Recognize packaging labels for product-specific exclusions. */
export function isUnsupportedInjectionFormat(format: string) {
  return /dual[ -]chamber|pen kit|injection pen/i.test(format)
}

/** Optional lab accessories are separate from any claim about injection suitability. */
export function preparationAddOnsAllowed(product: Pick<HttpTypes.StoreProduct, "metadata">, selectedFormat?: string) {
  return product.metadata?.preparation_addons_allowed === true
    && product.metadata?.preparation_addons_scope === "optional-laboratory-vial"
    && (selectedFormat === undefined || selectedFormat === "Vial")
}

/** Apply only the product-specific Decapeptide-12 exclusion, including stale responses. */
export function reviewedProductFormats(product: HttpTypes.StoreProduct): HttpTypes.StoreProduct {
  if (product.handle !== "decapeptide-12") return product
  return {
    ...product,
    variants: (product.variants ?? []).filter(variant => !isUnsupportedInjectionFormat(
      variant.options?.find(option => option.option?.title === "Format")?.value ?? variant.title ?? ""
    )),
  }
}
