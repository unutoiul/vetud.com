import type { HttpTypes } from "@medusajs/types"
import type { CategoryFacet } from "./catalog-filters"
import { cheapestPrice, readProductMeta, type ProductMeta } from "./product"
import { getProductThumbnail } from "./product-images"

/** A product as the header menu and the search list show it: small enough to send with every page. */
export type MenuProduct = {
  id: string
  handle: string
  title: string
  subtitle: string
  code: string
  accent: string
  artKind: ProductMeta["artKind"]
  /** The vial photograph, or null to draw the product art instead. */
  image: string | null
  categoryIds: string[]
  /** The lowest price in the visitor's currency; `hasRange` when other sizes cost more. */
  price: { amount: number; currencyCode: string; hasRange: boolean } | null
}

export type MenuCategory = Pick<CategoryFacet, "id" | "handle" | "name" | "count">

/** The catalog for the header's product menu, its mobile menu and the search's suggestions. */
export type ProductMenuData = { products: MenuProduct[]; categories: MenuCategory[] }

export const EMPTY_PRODUCT_MENU: ProductMenuData = { products: [], categories: [] }

export function toMenuProduct(product: HttpTypes.StoreProduct): MenuProduct | null {
  if (!product.handle) return null
  const meta = readProductMeta(product)
  const price = cheapestPrice(product)
  return {
    id: product.id,
    handle: product.handle,
    title: product.title ?? "",
    subtitle: product.subtitle ?? "",
    code: meta.code,
    accent: meta.accent,
    artKind: meta.artKind,
    image: getProductThumbnail(product.handle, product.thumbnail, "Vial") ?? null,
    categoryIds: (product.categories ?? []).map((category) => category.id),
    price: price ? { amount: price.amount, currencyCode: price.currencyCode, hasRange: price.hasRange } : null,
  }
}

/** Products in catalog order, and the shop's theme categories that have products. */
export function buildProductMenu(products: HttpTypes.StoreProduct[], categories: CategoryFacet[]): ProductMenuData {
  return {
    products: products.flatMap((product) => toMenuProduct(product) ?? []),
    categories: categories
      .filter((category) => category.group === "theme" && category.count > 0)
      .map(({ id, handle, name, count }) => ({ id, handle, name, count })),
  }
}

/** The products in one category, or all of them. */
export function productsIn(menu: ProductMenuData, categoryHandle?: string) {
  if (!categoryHandle) return menu.products
  const category = menu.categories.find((item) => item.handle === categoryHandle)
  return category ? menu.products.filter((product) => product.categoryIds.includes(category.id)) : []
}

/** Lot numbers look like "VTD01-2609A": letters and digits, a dash, then digits and an optional letter. */
export const looksLikeLot = (query: string) => /^[a-z]{2,5}\d{0,3}-\d{3,5}[a-z]?$/i.test(query.trim())
