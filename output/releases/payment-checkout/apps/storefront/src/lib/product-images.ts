type ProductImage = { url: string; alt?: string }
type ProductPhotography = { aspectRatio: string; images: ProductImage[] }

const penPhotography = (handle: string, title: string, amount = "40 mg"): ProductPhotography => ({
  aspectRatio: "4 / 3",
  images: [
    { url: `/images/products/${handle}-closed.webp`, alt: `${title} ${amount} pen kit, closed VETUD box` },
    { url: `/images/products/${handle}-open.webp`, alt: `${title} ${amount} pen kit, open VETUD box with pen and 12 needles` },
  ],
})

const sprayPhotography = (handle: string, title: string): ProductPhotography => ({
  aspectRatio: "4 / 5",
  images: [
    { url: `/images/products/${handle}-front.webp`, alt: `${title} 10 ml nasal spray, VETUD box on the left and bottle on the right` },
    { url: `/images/products/${handle}-alternate.webp`, alt: `${title} 10 ml nasal spray, VETUD bottle on the left and box on the right` },
  ],
})

/** The approved white-background photography, shared by every storefront surface. */
const photography: Record<string, ProductPhotography> = {
  retatrutide: penPhotography("retatrutide", "Retatrutide"),
  tirzepatide: penPhotography("tirzepatide", "Tirzepatide"),
  semaglutide: penPhotography("semaglutide", "Semaglutide"),
  selank: sprayPhotography("selank", "Selank"),
  semax: sprayPhotography("semax", "Semax"),
  "nad-plus": penPhotography("nad-plus", "NAD+", "1000 mg"),
  melanotan: penPhotography("melanotan", "Melanotan", "10 mg"),
  ipamorelin: penPhotography("ipamorelin", "Ipamorelin", "5 mg"),
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

export function getProductThumbnail(handle?: string | null, fallback?: string | null) {
  return getProductPhotography(handle)?.images[0].url ?? fallback
}
