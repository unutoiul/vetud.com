/**
 * The shop's simplified categories, in sidebar order (requested by the owner on 2026-11-01).
 * Handles stay as they were, so links, imports and earlier scripts keep working; only the names,
 * order and visibility change. `storefront_group: "theme"` puts a category in the shop sidebar.
 */
export const SHOP_CATEGORIES = [
  { handle: "weight-loss-research", name: "Weight management" },
  { handle: "skin-copper-peptides", name: "Skin & copper peptides" },
  { handle: "beauty", name: "Pigmentation" },
  { handle: "hair", name: "Hair" },
  { handle: "healing-regeneration-research", name: "Recovery & mobility" },
  { handle: "longevity-anti-aging-research", name: "Energy & metabolism" },
  { handle: "muscle-growth-research", name: "Performance & growth" },
  { handle: "cognitive-enhancement-research", name: "Concentration & focus" },
  { handle: "sleep-enhancement-research", name: "Calm & balance" },
  { handle: "immunity-enhancement-research", name: "Immune support" },
  { handle: "reproductive-health-research", name: "Sexual health" },
  { handle: "lab-supplies", name: "Laboratory supplies" },
] as const

/** Product-type groupings that stay in Medusa but out of the sidebar. */
export const FORMAT_CATEGORIES = ["peptide-series", "blends"] as const

/** Products that change shelf in the new scheme. */
export const SHOP_CATEGORY_MOVES = [
  { product: "selank", from: "cognitive-enhancement-research", to: "sleep-enhancement-research" },
] as const

export const shopCategoryDescription = (name: string) => `${name}: research materials grouped by theme for easier browsing. For laboratory research use only.`
