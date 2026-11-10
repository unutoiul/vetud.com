/**
 * Retail skincare serums (owner request 2026-11-09): finished cosmetics for the skin, sold in one
 * size and kept out of the storewide sale (`sale_excluded`). Photos live in the storefront at
 * /images/products/<handle>.webp. Prices are retail USD; other currencies are converted from it.
 */
export const SKINCARE_SERUMS_REVISION = "skincare-serums-2026-11-09-v1"
export const SKINCARE_IMAGE_ORIGIN = process.env.DUAL_CHAMBER_IMAGE_ORIGIN || "https://www.vetud.com"

export type SkincareSerum = {
  handle: string
  title: string
  code: string
  brand: string
  /** Shop shelves (category handles); the first is the main one. */
  categories: string[]
  subtitle: string
  description: string
  contents: string
  size: string
  sku: string
  usd: number
}

const USE = "For external use on the skin only. Patch-test before first use, avoid the eyes, and use sunscreen during the day."

/**
 * Shown on the product page and card in place of the research-use notice. The storefront reads it
 * from the product metadata (`notice_title`, `notice_text`), so Admin can change it per product.
 */
export const COSMETIC_NOTICE = {
  notice_title: "Cosmetic product for external use only",
  notice_text: "Apply to the skin only; do not swallow or inject. Patch-test before first use, avoid the eyes, and stop using it if irritation occurs.",
}

export const SKINCARE_SERUMS: SkincareSerum[] = [
  {
    handle: "anua-azelaic-acid-10-hyaluron-serum",
    title: "Anua Azelaic Acid 10 + Hyaluron Redness Soothing Serum",
    code: "ANUA-AZA10",
    brand: "Anua",
    categories: ["skin-copper-peptides"],
    subtitle: "Lightweight serum with 10% azelaic acid and hyaluronic acid, made for skin prone to redness.",
    description: `A lightweight serum from the Korean skincare brand Anua, with 10% azelaic acid and hyaluronic acid. Anua makes it to calm the look of redness in sensitive skin. Azelaic acid is an acid dermatologists use against redness, blemishes and dark marks; hyaluronic acid helps the skin hold water.\n\n30 ml dropper bottle. ${USE}`,
    contents: "1 Anua Azelaic Acid 10 + Hyaluron Redness Soothing Serum, 30 ml (1.01 fl oz) dropper bottle",
    size: "30 ml",
    sku: "ANUA-AZA10-30ML",
    usd: 25,
  },
  {
    handle: "anua-niacinamide-10-txa-4-serum",
    title: "Anua Niacinamide 10 + TXA 4 Serum",
    code: "ANUA-NIA10",
    brand: "Anua",
    categories: ["beauty", "skin-copper-peptides"],
    subtitle: "Brightening serum with 10% niacinamide and 4% tranexamic acid, made for dark spots and uneven tone.",
    description: `A brightening serum from the Korean skincare brand Anua, with 10% niacinamide (a form of vitamin B3) and 4% tranexamic acid (TXA). Anua makes it to fade the look of dark spots and even out skin tone. Both ingredients reduce how much pigment reaches the skin's surface, in different ways.\n\n30 ml dropper bottle. ${USE}`,
    contents: "1 Anua Niacinamide 10 + TXA 4 Serum, 30 ml (1.01 fl oz) dropper bottle",
    size: "30 ml",
    sku: "ANUA-NIA10-30ML",
    usd: 25,
  },
]

export const serumImageUrl = (handle: string) => `${SKINCARE_IMAGE_ORIGIN}/images/products/${handle}.webp`
