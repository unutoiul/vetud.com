import type { HttpTypes } from "@medusajs/types"

type CatalogProduct = Pick<HttpTypes.StoreProduct, "id" | "handle" | "title" | "metadata" | "variants">
export type ResearchAvailability = "in_stock" | "available_to_order" | "out_of_stock" | "unavailable"

/** Match only an exact catalog identity or an explicit editorial metadata mapping. */
export function matchesPeptide(product: CatalogProduct, slug: string) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (normalize(product.handle ?? "") === normalize(slug)) return true
  const named = product.metadata?.named_peptide
  if (typeof named === "string" && normalize(named) === normalize(slug)) return true
  const topics = product.metadata?.learn_peptides
  return Array.isArray(topics) && topics.some((topic) => typeof topic === "string" && topic === slug)
}

/**
 * How specifically a product is about a peptide: its own product (3), named after it (2), about it
 * alone (1), or a blend that includes it (0.5). Library links prefer the most specific product.
 */
export function peptideMatchRank(product: CatalogProduct, slug: string) {
  if (!matchesPeptide(product, slug)) return 0
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "")
  if (normalize(product.handle ?? "") === normalize(slug)) return 3
  const named = product.metadata?.named_peptide
  if (typeof named === "string" && normalize(named) === normalize(slug)) return 2
  const topics = product.metadata?.learn_peptides
  return Array.isArray(topics) && topics.length === 1 ? 1 : 0.5
}

/** A regional price is required. Backorders and unmanaged inventory are not physical stock. */
export function researchAvailability(product: CatalogProduct): ResearchAvailability {
  const variants = (product.variants ?? []).filter((variant) => typeof variant.calculated_price?.calculated_amount === "number" && Number.isFinite(variant.calculated_price.calculated_amount))
  if (!variants.length) return "unavailable"
  if (variants.some((variant) => variant.manage_inventory === true && typeof variant.inventory_quantity === "number" && variant.inventory_quantity > 0)) return "in_stock"
  if (variants.some((variant) => variant.manage_inventory === false || variant.allow_backorder === true)) return "available_to_order"
  if (variants.every((variant) => variant.manage_inventory === true && typeof variant.inventory_quantity === "number" && variant.inventory_quantity <= 0)) return "out_of_stock"
  return "unavailable"
}
