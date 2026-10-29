const assert = require("node:assert/strict")
const fs = require("node:fs/promises")
const crypto = require("node:crypto")
const dotenv = require("../../apps/backend/node_modules/dotenv")
const Medusa = require("../../apps/storefront/node_modules/@medusajs/js-sdk").default
const sharp = require("../../apps/storefront/node_modules/sharp")
const handles = ["nad-plus", "melanotan", "ipamorelin"]
const hash = bytes => crypto.createHash("sha256").update(bytes).digest("hex")

async function main() {
  const env = dotenv.parse(await fs.readFile(".vercel/.env.production.local"))
  const sdk = new Medusa({ baseUrl: env.NEXT_PUBLIC_MEDUSA_BACKEND_URL, publishableKey: env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY })
  const { product_categories } = await sdk.store.category.list({ fields: "id,name,handle,+metadata", limit: 100 })
  const beauty = product_categories.find(category => category.handle === "beauty")
  assert.equal(beauty?.name, "Beauty")
  assert.equal(beauty.metadata?.storefront_group, "research")
  assert.equal(product_categories.filter(category => category.metadata?.storefront_group === "research").length, 9)
  for (const handle of handles) {
    const { products } = await sdk.store.product.list({ handle, fields: "id,handle", limit: 10 })
    assert.equal(products.length, 0, `${handle} was unexpectedly published`)
  }
  const images = await Promise.all(handles.flatMap(handle => ["closed", "open"].map(async view => {
    const asset = `${handle}-${view}.webp`
    const response = await fetch(`https://www.vetud.com/images/products/${asset}`, { signal: AbortSignal.timeout(20000) })
    assert.equal(response.status, 200)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.equal(hash(bytes), hash(await fs.readFile(`apps/storefront/public/images/products/${asset}`)))
    const metadata = await sharp(bytes).metadata()
    assert.equal(metadata.width, 1448)
    assert.equal(metadata.height, 1086)
    return { asset, bytes: bytes.length, sha256: hash(bytes) }
  })))
  const page = await fetch("https://www.vetud.com/gb/shop?category=beauty", { signal: AbortSignal.timeout(30000) })
  assert.equal(page.status, 200)
  const html = await page.text()
  assert(html.includes('aria-label="Beauty, 0 products"'), "Shop category cache has not refreshed to include Beauty yet")
  assert(html.includes("No products in these categories yet."))
  const created = JSON.parse(await fs.readFile("output/qa/supplied-products-created.json", "utf8"))
  const repeated = JSON.parse(await fs.readFile("output/qa/supplied-products-idempotent.json", "utf8"))
  assert.equal(repeated.result.created.length, 0)
  assert.equal(repeated.result.skipped.length, 3)
  assert.deepEqual(repeated.products.map(product => product.id).sort(), created.products.map(product => product.id).sort())
  const report = { checkedAt: new Date().toISOString(), draftProducts: 3, researchCategories: 9, beautyVisible: true, draftsExcludedFromStore: true, repeatImportCreatedNothing: true, existingProductsUnchanged: repeated.existingProductsUnchanged, stockUnchanged: repeated.stockUnchanged, imageHashes: images }
  await fs.writeFile("output/qa/supplied-products-live.json", JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
