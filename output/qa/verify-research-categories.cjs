const assert = require("node:assert/strict")
const fs = require("node:fs/promises")
const path = require("node:path")
const { promisify } = require("node:util")
const { execFile } = require("node:child_process")
const dotenv = require("../../apps/backend/node_modules/dotenv")
const Medusa = require("../../apps/storefront/node_modules/@medusajs/js-sdk").default
const run = promisify(execFile)
const mode = process.argv[2] || "database"
const deployment = process.argv[3]
const expectedNames = ["Healing and Regeneration Research", "Immunity Enhancement Research", "Longevity and Anti-aging Research", "Reproductive Health Research", "Sleep Enhancement Research", "Weight Loss Research", "Cognitive Enhancement Research", "Muscle Growth Research"]
const cli = path.join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js")

function commercialData(product) {
  return {
    id: product.id, title: product.title, handle: product.handle, description: product.description, thumbnail: product.thumbnail, metadata: product.metadata,
    images: product.images.map(image => ({ id: image.id, url: image.url })).sort((a, b) => a.id.localeCompare(b.id)),
    variants: product.variants.map(variant => ({ id: variant.id, title: variant.title, sku: variant.sku, manage_inventory: variant.manage_inventory, allow_backorder: variant.allow_backorder, inventory_quantity: variant.inventory_quantity, price: variant.calculated_price?.calculated_amount, currency: variant.calculated_price?.currency_code })).sort((a, b) => a.id.localeCompare(b.id)),
  }
}

async function getPage(route) {
  if (deployment) {
    const { stdout } = await run(process.execPath, [cli, "curl", route, "--deployment", deployment, "--scope", "gold-structure-engine", "--", "--fail", "--silent", "--show-error", "--max-time", "30"], { maxBuffer: 8 * 1024 * 1024, timeout: 45000 })
    return stdout
  }
  const response = await fetch(`https://www.vetud.com${route}`, { signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, route)
  return response.text()
}

async function main() {
  const env = dotenv.parse(await fs.readFile(".vercel/.env.production.local"))
  const sdk = new Medusa({ baseUrl: env.NEXT_PUBLIC_MEDUSA_BACKEND_URL, publishableKey: env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY })
  const before = JSON.parse(await fs.readFile("output/qa/research-categories-before.json", "utf8"))
  const [{ products }, { product_categories: categories }] = await Promise.all([
    sdk.store.product.list({ region_id: before.regionId, fields: "id,title,handle,description,thumbnail,+metadata,*categories,*images,*variants,*variants.calculated_price,+variants.inventory_quantity", limit: 100 }),
    sdk.store.category.list({ fields: "id,name,handle,rank,+metadata", limit: 100, order: "rank" }),
  ])
  const research = categories.filter(category => category.metadata?.storefront_group === "research")
  assert.deepEqual(research.map(category => category.name), expectedNames)
  assert.equal(categories.length, before.categories.length + 8)
  assert.equal(new Set(categories.map(category => category.handle)).size, categories.length)
  assert.equal(products.length, before.products.length)
  for (const product of products) {
    const old = before.products.find(old => old.id === product.id)
    assert(old)
    assert.deepEqual(commercialData(product), commercialData(old), `Product details changed: ${product.handle}`)
    for (const category of old.categories) assert(product.categories.some(current => current.id === category.id), `Original category removed: ${product.handle}`)
    const newCategories = product.categories.filter(category => research.some(current => current.id === category.id)).map(category => category.handle)
    const expected = ["retatrutide", "tirzepatide", "semaglutide"].includes(product.handle) ? ["weight-loss-research"] : ["selank", "semax"].includes(product.handle) ? ["cognitive-enhancement-research"] : []
    assert.deepEqual(newCategories.sort(), expected.sort(), product.handle)
  }
  const counts = research.map(category => ({ id: category.id, handle: category.handle, name: category.name, count: products.filter(product => product.categories.some(item => item.id === category.id)).length }))
  if (mode === "idempotent") {
    const first = JSON.parse(await fs.readFile("output/qa/research-categories-database.json", "utf8"))
    assert.deepEqual(counts, first.categories, "Rerunning setup changed category IDs or assignments")
  }
  const routes = []
  if (!["database", "idempotent"].includes(mode)) {
    const cases = [
      ["", products.map(product => product.handle)],
      ["?category=weight-loss-research", ["retatrutide", "tirzepatide", "semaglutide"]],
      ["?category=cognitive-enhancement-research", ["selank", "semax"]],
      ["?category=weight-loss-research&category=cognitive-enhancement-research", ["retatrutide", "tirzepatide", "semaglutide", "selank", "semax"]],
      ["?category=weight-loss-research&category=lab-supplies", []],
      ["?category=sleep-enhancement-research", []],
      ["?category=peptide-series", before.products.filter(product => product.categories.some(category => category.handle === "peptide-series")).map(product => product.handle)],
      ["?category=missing-category", []],
      ["?q=Semax&category=cognitive-enhancement-research&sort=name", ["semax"]],
      ["?category=weight-loss-research&sort=price-asc", ["retatrutide", "tirzepatide", "semaglutide"]],
    ]
    for (const [query, expected] of cases) {
      const route = `/gb/shop${query}`
      const html = await getPage(route)
      const actual = [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(match => match[0].match(/href="\/gb\/products\/([^"?#]+)"/)?.[1]).filter(Boolean)
      assert.deepEqual([...actual].sort(), [...expected].sort(), route)
      for (const name of expectedNames) assert(html.includes(name), `Category label missing: ${name}`)
      assert(html.includes('aria-label="Product categories"'))
      assert(html.includes('name="category"'))
      assert(html.includes("Apply categories"))
      for (const category of counts) assert(html.includes(`aria-label="${category.name}, ${category.count} ${category.count === 1 ? "product" : "products"}"`), `Wrong visible count for ${category.handle}`)
      const selected = new URLSearchParams(query).getAll("category").filter(handle => categories.some(category => category.handle === handle))
      const checked = [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0]).filter(input => input.includes('type="checkbox"') && /\bchecked(?:="[^"]*")?(?:\s|\/>|>)/.test(input)).map(input => input.match(/value="([^"]+)"/)?.[1])
      assert.deepEqual(checked.sort(), selected.sort(), `Checkbox state: ${route}`)
      if (query.includes("sort=price-asc")) {
        const price = handle => Math.min(...products.find(product => product.handle === handle).variants.map(variant => variant.calculated_price?.calculated_amount ?? Infinity))
        assert.deepEqual(actual, [...expected].sort((a, b) => price(a) - price(b)), "Price sort changed")
      }
      if (!expected.length) assert(html.includes("No products in these categories yet."))
      routes.push({ route, products: actual.length })
      console.log(`PASS ${route}: ${actual.length} products`)
    }
  }
  const report = { checkedAt: new Date().toISOString(), mode, deployment, categories: counts, productCount: products.length, commercialDataUnchanged: true, originalCategoriesPreserved: true, routes, visualReview: "Unavailable: browser access host is unavailable." }
  await fs.writeFile(`output/qa/research-categories-${mode}.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
