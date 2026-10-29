const fs = require("node:fs/promises")
const dotenv = require("../../apps/backend/node_modules/dotenv")
const Medusa = require("../../apps/storefront/node_modules/@medusajs/js-sdk").default

async function main() {
  const env = dotenv.parse(await fs.readFile(".vercel/.env.production.local"))
  const sdk = new Medusa({ baseUrl: env.NEXT_PUBLIC_MEDUSA_BACKEND_URL, publishableKey: env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY })
  const { regions } = await sdk.store.region.list()
  const region = regions.find(region => region.countries.some(country => country.iso_2 === "gb"))
  const { products } = await sdk.store.product.list({ region_id: region.id, fields: "id,title,handle,description,thumbnail,+metadata,*categories,*images,*variants,*variants.calculated_price,+variants.inventory_quantity", limit: 100 })
  const { product_categories } = await sdk.store.category.list({ fields: "id,name,handle,rank,+metadata", limit: 100 })
  await fs.writeFile("output/qa/research-categories-before.json", JSON.stringify({ regionId: region.id, products, categories: product_categories }, null, 2))
  console.log(JSON.stringify({ products: products.map(product => ({ handle: product.handle, title: product.title, categories: product.categories.map(category => category.handle) })), categories: product_categories }, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
