import type { HttpTypes } from "@medusajs/types"
import type { ProductSort } from "./medusa/products"

export type CategoryFacet = {
  id: string
  handle: string
  name: string
  /** "theme" categories are the shop sidebar; "format" ones (Peptide Series, Blends) stay in Medusa only. */
  group: "theme" | "format"
  count: number
}

// "research" is the value used before the categories were simplified; treat it the same.
const THEME_GROUPS = new Set(["theme", "research"])

export function categoryFacets(categories: HttpTypes.StoreProductCategory[], products: HttpTypes.StoreProduct[]): CategoryFacet[] {
  const counts = new Map<string, number>()
  for (const product of products) {
    for (const id of new Set((product.categories ?? []).map(category => category.id))) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return categories.map(category => ({
    id: category.id,
    handle: category.handle,
    name: category.name,
    group: THEME_GROUPS.has(String(category.metadata?.storefront_group)) ? "theme" : "format",
    count: counts.get(category.id) ?? 0,
  }))
}

/** OR within a group; theme and product type are combined with AND. */
export function filterByCategories(products: HttpTypes.StoreProduct[], categories: CategoryFacet[], selected: string[]) {
  if (!selected.length) return products
  const facets = categories.filter(category => selected.includes(category.handle))
  if (new Set(selected).size !== facets.length) return []
  const themes = facets.filter(category => category.group === "theme")
  const formats = facets.filter(category => category.group === "format")
  return products.filter(product => {
    const ids = new Set((product.categories ?? []).map(category => category.id))
    return (!themes.length || themes.some(category => ids.has(category.id)))
      && (!formats.length || formats.some(category => ids.has(category.id)))
  })
}

export function shopQuery({ query, sort = "relevance", categories = [] }: { query?: string; sort?: ProductSort; categories?: string[] }) {
  const params = new URLSearchParams()
  if (query) params.set("q", query)
  for (const category of new Set(categories)) params.append("category", category)
  if (sort !== "relevance") params.set("sort", sort)
  return params.toString()
}
