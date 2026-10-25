const fs = require("node:fs")
const assert = require("node:assert/strict")
const dotenv = require("../../apps/backend/node_modules/dotenv")
const live = process.argv.includes("live")
const codes = ["eur", "usd", "cad", "aud", "jpy", "cny", "sgd", "hkd", "aed"]

async function main() {
  const env = dotenv.parse(fs.readFileSync(live ? ".vercel/.env.production.local" : "apps/storefront/.env.local"))
  const base = live ? env.NEXT_PUBLIC_MEDUSA_BACKEND_URL : "http://localhost:9000"
  const headers = { "x-publishable-api-key": env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
  const before = JSON.parse(fs.readFileSync(`output/qa/major-markets-${live ? "live" : "local"}-before.json`))
  const rates = JSON.parse(fs.readFileSync("output/qa/major-currency-rates.json")).rates
  async function request(path, body, method = "GET") {
    const response = await fetch(base + path, { headers: { ...headers, "content-type": "application/json" }, method, ...(body ? { body: JSON.stringify(body) } : {}) })
    const data = await response.json()
    assert.equal(response.status, 200, JSON.stringify(data))
    return data
  }
  const { regions } = await request("/store/regions?fields=id,name,currency_code,metadata,*countries")
  const active = regions.filter(region => region.countries.length)
  assert.deepEqual(active.map(region => region.currency_code).sort(), [...codes].sort())
  const euro = active.find(region => region.currency_code === "eur")
  const oldEuro = before.find(market => market.region.currency_code === "eur")
  assert.equal(euro.id, oldEuro.region.id)
  const oldEuropeanCountries = before.filter(market => market.region.currency_code !== "usd").flatMap(market => market.region.countries.map(country => country.iso_2)).sort()
  assert.deepEqual(euro.countries.map(country => country.iso_2).sort(), oldEuropeanCountries)
  assert.equal(euro.metadata.free_shipping_threshold, oldEuro.region.metadata.free_shipping_threshold)
  const after = await Promise.all(regions.map(async region => ({ region, products: (await request(`/store/products?region_id=${region.id}&fields=id,title,handle,description,subtitle,thumbnail,+metadata,*images,*variants,*variants.calculated_price,+variants.inventory_quantity&limit=100`)).products })))
  let retainedPrices = 0
  for (const oldMarket of before) {
    const current = after.find(market => market.region.id === oldMarket.region.id)
    assert(current)
    for (const oldProduct of oldMarket.products) {
      const product = current.products.find(product => product.id === oldProduct.id)
      for (const key of ["title", "subtitle", "description", "thumbnail", "images", "metadata"]) assert.deepEqual(product[key], oldProduct[key])
      for (const oldVariant of oldProduct.variants) {
        const variant = product.variants.find(variant => variant.id === oldVariant.id)
        for (const key of ["sku", "title", "inventory_quantity", "manage_inventory", "allow_backorder"]) assert.equal(variant[key], oldVariant[key])
        assert.equal(variant.calculated_price.calculated_amount, oldVariant.calculated_price.calculated_amount)
        retainedPrices++
      }
    }
  }
  let newPrices = 0
  for (const market of after.filter(market => !before.some(old => old.region.id === market.region.id))) {
    assert.equal(market.products.length, 5)
    assert.equal(market.region.metadata.free_shipping_threshold, undefined)
    for (const product of market.products) {
      const euroProduct = oldEuro.products.find(old => old.id === product.id)
      for (const variant of product.variants) {
        const euroVariant = euroProduct.variants.find(old => old.id === variant.id)
        assert.equal(variant.calculated_price.calculated_amount, Math.round(euroVariant.calculated_price.calculated_amount * rates[market.region.currency_code]))
        newPrices++
      }
    }
  }
  assert.equal(retainedPrices, 132)
  assert.equal(newPrices, 77)
  if (!live) {
    const oldPoland = before.find(market => market.region.currency_code === "pln")
    const usd = active.find(region => region.currency_code === "usd")
    const variant = oldEuro.products.find(product => product.handle === "retatrutide").variants.find(variant => variant.title === "40 mg")
    let { cart } = await request("/store/carts", { region_id: oldPoland.region.id }, "POST")
    ;({ cart } = await request(`/store/carts/${cart.id}/line-items`, { variant_id: variant.id, quantity: 1 }, "POST"))
    ;({ cart } = await request(`/store/carts/${cart.id}`, { region_id: euro.id }, "POST"))
    assert.equal(cart.currency_code, "eur")
    assert.equal(cart.items[0].unit_price, variant.calculated_price.calculated_amount)
    ;({ cart } = await request(`/store/carts/${cart.id}`, { region_id: usd.id }, "POST"))
    assert.equal(cart.currency_code, "usd")
    assert.equal(cart.items[0].unit_price, 688)
    console.log("Local cart retained its product and recalculated correctly from legacy PLN to EUR to USD; no order placed.")
  }
  fs.writeFileSync(`output/qa/major-markets-${live ? "live" : "local"}-after.json`, JSON.stringify(after, null, 2))
  console.log(`Verified 9 active currencies, ${euro.countries.length} EUR countries, 77 new prices, and all 132 existing prices and product details retained.`)
}

main().catch(error => { console.error(error); process.exit(1) })
