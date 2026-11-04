/** `format` ties a photo to the "Format" option value it shows, so the gallery can follow the selection. */
type ProductImage = { url: string; alt?: string; label?: string; format?: string }
type ProductPhotography = { aspectRatio: string; images: ProductImage[] }

export const PEN_EXPLAINER_IMAGE = "/images/products/dual-chamber-pen.webp"
export const REUSABLE_PEN_IMAGE = "/images/products/reusable-dual-chamber-pen.webp"
const REUSABLE_PEN_ALT = "The reusable VETUD dual-chamber pen, labelled: graduated holder, freeze-dried peptide, diluent and reusable pen body"

/**
 * Products whose own pen kit box is photographed, closed and open (product handle → photo name).
 * Melanotan I and II share the "Melanotan 10 mg" box.
 */
const PEN_KIT_BOXES: Record<string, string> = {
  ipamorelin: "ipamorelin",
  "melanotan-i": "melanotan",
  "melanotan-ii": "melanotan",
  "nad-plus": "nad-plus",
  retatrutide: "retatrutide",
  semaglutide: "semaglutide",
  tesamorelin: "tesamorelin",
  tirzepatide: "tirzepatide",
}

/** Sold without a pen kit box, so no box photo. */
const NO_PEN_KIT = new Set(["bacteriostatic-water"])

/** The unlabelled open VETUD box, for products without their own box photo. */
const GENERIC_OPEN_BOX = "/images/products/generic-open.webp"

/**
 * The photos of each format: the cartridge (dual-chamber vial), the vial and the pen kit box.
 * Products without their own box photo show the generic open box for the kit.
 */
const formatPhotos = (handle: string, title: string) => {
  const named = Object.hasOwn(PEN_KIT_BOXES, handle) ? PEN_KIT_BOXES[handle] : undefined
  const openBox = named
    ? { url: `/images/products/${named}-open.webp`, alt: `${title} pen kit, open box with the reusable pen, 12 needles and the instruction booklet`, label: "Open pen kit", format: "Pen kit box" }
    : NO_PEN_KIT.has(handle) ? undefined
    : { url: GENERIC_OPEN_BOX, alt: "VETUD pen kit, open box with the reusable pen, 12 needles and the instruction booklet", label: "Pen kit box", format: "Pen kit box" }
  return {
    pen: { url: `/images/products/${handle}-pen.webp`, alt: `${title} dual-chamber vial: powder and BAC water in separate chambers`, label: "Dual-chamber vial", format: "Dual-chamber vial" },
    box: named ? { url: `/images/products/${named}-closed.webp`, alt: `${title} pen kit, closed VETUD box`, label: "Pen kit box", format: "Pen kit box" } : undefined,
    openBox,
    vial: { url: `/images/products/${handle}-vial.webp`, alt: `${title} research vial with VETUD label`, label: "Vial", format: "Vial" },
    reusable: { url: REUSABLE_PEN_IMAGE, alt: REUSABLE_PEN_ALT, label: "Reusable pen", format: openBox ? undefined : "Pen kit box" },
    /** The photo that stands for the pen kit box: the open box shows what's inside. */
    kit: openBox ? { url: openBox.url, alt: openBox.alt } : { url: REUSABLE_PEN_IMAGE, alt: REUSABLE_PEN_ALT },
  }
}

export type FormatPhotos = ReturnType<typeof formatPhotos>

const formatPhotography = (handle: string, title: string): ProductPhotography => {
  const { pen, box, openBox, vial, reusable } = formatPhotos(handle, title)
  return { aspectRatio: "1 / 1", images: [pen, vial, ...(box ? [box] : []), ...(openBox ? [openBox] : []), reusable] }
}

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

/** Lab supplies with their own photos. */
const SUPPLY_PHOTOGRAPHY: Record<string, ProductPhotography> = {
  "u-100-syringes": {
    aspectRatio: "1 / 1",
    images: [
      { url: "/images/products/u-100-syringes-box.webp", alt: "Open VETUD box of 10 U-100 insulin syringes", label: "Box of 10" },
      { url: "/images/products/u-100-syringes-single.webp", alt: "One VETUD U-100 insulin syringe with its orange needle cap", label: "Syringe" },
    ],
  },
}

/** The approved white-background photography, shared by every storefront surface. */
const photography: Record<string, ProductPhotography> = {
  ...Object.fromEntries(Object.entries(FORMAT_PRODUCTS).map(([handle, title]) => [handle, formatPhotography(handle, title)])),
  ...SUPPLY_PHOTOGRAPHY,
}

/** The pen, box and vial photos for the pen-vs-vial section, for products sold in both formats. */
export function getFormatPhotos(handle?: string | null): FormatPhotos | undefined {
  return handle && Object.hasOwn(FORMAT_PRODUCTS, handle) ? formatPhotos(handle, FORMAT_PRODUCTS[handle]) : undefined
}

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
