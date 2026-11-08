import type { HttpTypes } from "@medusajs/types"

/** Product-specific sterility and cartridge compatibility have not been documented. */
export function isUnsupportedInjectionFormat(format: string) {
  return /dual[ -]chamber|pen kit|injection pen/i.test(format)
}

/** Optional lab accessories are separate from any claim about injection suitability. */
export function preparationAddOnsAllowed(product: Pick<HttpTypes.StoreProduct, "metadata">, selectedFormat?: string) {
  return product.metadata?.preparation_addons_allowed === true
    && product.metadata?.preparation_addons_scope === "optional-laboratory-vial"
    && (selectedFormat === undefined || selectedFormat === "Vial")
}

/** Also protects stale search results and cached product responses from offering retired formats. */
export function reviewedProductFormats(product: HttpTypes.StoreProduct): HttpTypes.StoreProduct {
  return {
    ...product,
    variants: (product.variants ?? []).filter(variant => !isUnsupportedInjectionFormat(
      variant.options?.find(option => option.option?.title === "Format")?.value ?? variant.title ?? ""
    )),
  }
}
