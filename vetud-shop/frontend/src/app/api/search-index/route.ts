import type { SearchIndex } from "@/lib/site-search"
import { sdk } from "@/lib/medusa/sdk"

/** Product titles and descriptions, compact, for the header search in every language. Prerendered at build. */
export async function GET() {
  const products = await sdk.store.product.list({ limit: 1000, fields: "id,title,handle,description" }).then(result => result.products).catch(() => [])
  const index: SearchIndex = {
    products: products.map(product => ({ id: product.id, title: product.title, handle: product.handle, description: product.description ?? "" })),
  }
  return Response.json(index)
}
