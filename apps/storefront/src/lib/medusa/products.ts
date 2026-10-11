import type { HttpTypes } from "@medusajs/types"
import { cacheLife, cacheTag } from "next/cache"
import { sdk } from "./sdk"

export const PRODUCT_FIELDS = [
  "id",
  "title",
  "subtitle",
  "handle",
  "description",
  "thumbnail",
  "created_at",
  "+metadata",
  "*images",
  "*categories",
  "*collection",
  "*variants",
  "*variants.calculated_price",
  "+variants.inventory_quantity",
  "*variants.options",
].join(",")

export type ProductSort = "featured" | "price-asc" | "price-desc" | "name"

type ListProductsInput = {
  regionId: string
  categoryId?: string
  collectionId?: string
  limit?: number
}

export async function listProducts({
  regionId,
  categoryId,
  collectionId,
  limit = 100,
}: ListProductsInput): Promise<HttpTypes.StoreProduct[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products")

  const { products } = await sdk.store.product.list({
    region_id: regionId,
    fields: PRODUCT_FIELDS,
    limit,
    order: "created_at",
    ...(categoryId ? { category_id: [categoryId] } : {}),
    ...(collectionId ? { collection_id: [collectionId] } : {}),
  })
  return products
}

export async function getProductByHandle(
  handle: string,
  regionId: string
): Promise<HttpTypes.StoreProduct | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products", `product:${handle}`)

  const { products } = await sdk.store.product.list({
    handle,
    region_id: regionId,
    fields: PRODUCT_FIELDS,
    limit: 1,
  })
  return products[0] ?? null
}

export async function listProductHandles(): Promise<string[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products")

  const { products } = await sdk.store.product.list({ fields: "handle", limit: 500 })
  return products.map((product) => product.handle).filter((handle): handle is string => !!handle)
}

/**
 * Full-text search through Meilisearch. The plugin's hydrated route returns regular store
 * products (with region prices and inventory) in relevance order.
 */
export async function searchProducts(
  query: string,
  regionId: string,
  limit = 24
): Promise<HttpTypes.StoreProduct[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("products", "search")

  const { products } = await sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>(
    "/store/meilisearch/products",
    { query: { query, region_id: regionId, fields: PRODUCT_FIELDS, limit } }
  )
  return products
}

export async function listCategories(): Promise<HttpTypes.StoreProductCategory[]> {
  "use cache"
  cacheLife("hours")
  cacheTag("categories")

  const { product_categories } = await sdk.store.category.list({
    fields: "id,name,handle,description,rank",
    limit: 100,
  })
  return product_categories
}

export async function getCollectionByHandle(
  handle: string
): Promise<HttpTypes.StoreCollection | null> {
  "use cache"
  cacheLife("hours")
  cacheTag("collections")

  const { collections } = await sdk.store.collection.list({ handle, limit: 1 })
  return collections[0] ?? null
}
