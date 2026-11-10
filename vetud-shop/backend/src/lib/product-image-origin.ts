/** The storefront address that product images are served from. Set it when the shop's domain changes. */
export const PRODUCT_IMAGE_ORIGIN = (process.env.PRODUCT_IMAGE_ORIGIN || process.env.DUAL_CHAMBER_IMAGE_ORIGIN || "https://www.vetud.com").replace(/\/$/, "")
