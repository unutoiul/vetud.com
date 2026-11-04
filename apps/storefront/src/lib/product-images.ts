/** `format` ties a photo to the "Format" option value it shows, so the gallery can follow the selection. */
type ProductImage = { url: string; alt?: string; label?: string; format?: string }
type ProductPhotography = { aspectRatio: string; images: ProductImage[] }

export const PEN_EXPLAINER_IMAGE = "/images/products/dual-chamber-pen.webp"

const formatPhotography = (handle: string, title: string): ProductPhotography => ({
  aspectRatio: "1 / 1",
  images: [
    { url: `/images/products/${handle}-pen.webp`, alt: `${title} dual-chamber cartridge: powder and BAC water in separate chambers`, label: "Dual-chamber pen", format: "Dual-chamber pen" },
    { url: `/images/products/${handle}-vial.webp`, alt: `${title} research vial with VETUD label`, label: "Vial", format: "Vial" },
    { url: PEN_EXPLAINER_IMAGE, alt: "How the VETUD dual-chamber pen holds the cartridge: cartridge holder, peptide powder, BAC water and pen body", label: "How the pen works" },
  ],
})

/** The 28 products sold as a dual-chamber pen or a vial (prepare-dual-chamber-images.mjs makes the photos). */
const FORMAT_PRODUCTS: Record<string, string> = {
  "5-amino-1mq": "5-Amino-1MQ",
  "aod-9604": "AOD-9604",
  "ara-290": "ARA-290",
  "bpc-157": "BPC-157",
  "cjc-1295-ipamorelin": "CJC-1295 + Ipamorelin",
  dsip: "DSIP",
  "ghk-cu": "GHK-Cu",
  "glow-blend": "GLOW Blend",
  glutathione: "Glutathione",
  "bacteriostatic-water": "Bacteriostatic Water (H2O)",
  "igf-1-lr3": "IGF-1 LR3",
  ipamorelin: "Ipamorelin",
  "klow-blend": "KLOW Blend",
  kpv: "KPV",
  "mots-c": "MOTS-c",
  "melanotan-i": "Melanotan I",
  "melanotan-ii": "Melanotan II",
  "nad-plus": "NAD+",
  "pt-141": "PT-141",
  retatrutide: "Retatrutide",
  semaglutide: "Semaglutide (SM-1)",
  "ss-31": "SS-31",
  selank: "Selank",
  semax: "Semax",
  "tb-500": "TB-500",
  tirzepatide: "Tirzepatide (TZ-2)",
  tesamorelin: "Tesamorelin",
  "wolverine-blend": "Wolverine Blend",
}

/** The approved white-background photography, shared by every storefront surface. */
const photography: Record<string, ProductPhotography> = Object.fromEntries(
  Object.entries(FORMAT_PRODUCTS).map(([handle, title]) => [handle, formatPhotography(handle, title)])
)

export function getProductPhotography(handle?: string | null): ProductPhotography | undefined {
  return handle && Object.hasOwn(photography, handle) ? photography[handle] : undefined
}

export function getProductImages(product: {
  handle?: string | null
  thumbnail?: string | null
  images?: { url: string }[] | null
}): ProductImage[] {
  return getProductPhotography(product.handle)?.images
    ?? (product.images?.length ? product.images : product.thumbnail ? [{ url: product.thumbnail }] : [])
}

/**
 * The photo of the format a cart or order line is for ("Vial · 10 mg" shows the vial). Lines of
 * earlier products on the same handle (pen kits, sprays) keep their own stored thumbnail.
 */
export function getProductThumbnail(handle?: string | null, fallback?: string | null, variantTitle?: string | null) {
  const images = getProductPhotography(handle)?.images
  if (!images) return fallback
  if (variantTitle === undefined) return images[0].url
  return images.find((image) => image.format && variantTitle?.startsWith(image.format))?.url ?? fallback ?? images[0].url
}
