const fs = require('fs')
const assert = require('node:assert/strict')
const dotenv = require('../../apps/backend/node_modules/dotenv')
const live = process.argv[2] === 'live'
const env = dotenv.parse(fs.readFileSync(live ? '.vercel/.env.production.local' : 'apps/storefront/.env.local'))
const base = live ? env.NEXT_PUBLIC_MEDUSA_BACKEND_URL : 'http://localhost:9000'
const before = JSON.parse(fs.readFileSync(live ? 'output/qa/pricing-before-premium.json' : 'output/qa/pricing-local-before-premium.json'))
const fx = JSON.parse(fs.readFileSync('output/qa/premium-fx-rates.json'))

;(async () => {
  const headers = { 'x-publishable-api-key': env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY }
  const { regions } = await (await fetch(base + '/store/regions', { headers })).json()
  assert.equal(regions.length, 12)
  const after = []
  let checked = 0
  for (const region of regions) {
    const response = await fetch(base + '/store/products?region_id=' + region.id + '&fields=id,title,handle,thumbnail,+metadata,*images,*variants,*variants.calculated_price,+variants.inventory_quantity&limit=100', { headers })
    assert.equal(response.status, 200)
    const { products } = await response.json()
    assert.equal(products.length, 5)
    const oldRegion = before.find(row => row.currency === region.currency_code)
    for (const product of products) {
      const oldProduct = oldRegion.products.find(row => row.id === product.id)
      assert(oldProduct)
      assert.equal(product.title, oldProduct.title)
      assert.equal(product.thumbnail, oldProduct.thumbnail)
      assert.deepEqual(product.images, oldProduct.images)
      assert.equal(product.variants.length, oldProduct.variants.length)
      for (const [key, value] of Object.entries(oldProduct.metadata)) assert.deepEqual(product.metadata[key], value)
      assert.equal(product.metadata.retail_pricing_multiplier, 2)
      for (const variant of product.variants) {
        const oldVariant = oldProduct.variants.find(row => row.id === variant.id)
        assert(oldVariant)
        for (const field of ['sku', 'title', 'inventory_quantity', 'manage_inventory', 'allow_backorder']) assert.equal(variant[field], oldVariant[field])
        const original = oldVariant.calculated_price?.calculated_amount
        const usdProduct = before.find(row => row.currency === 'usd').products.find(row => row.id === product.id)
        const eurProduct = before.find(row => row.currency === 'eur').products.find(row => row.id === product.id)
        const oldUsd = usdProduct.variants.find(row => row.id === variant.id).calculated_price.calculated_amount
        const oldEur = eurProduct.variants.find(row => row.id === variant.id).calculated_price?.calculated_amount
        const euroAnchor = oldEur == null ? Math.ceil(oldUsd * 2 / fx.rates.usd) : oldEur * 2
        const expected = original != null ? Math.round(original * 2 * 100) / 100 : region.currency_code === 'eur' ? euroAnchor : Math.round(euroAnchor * fx.rates[region.currency_code])
        assert.equal(variant.calculated_price?.currency_code, region.currency_code)
        assert.equal(variant.calculated_price?.calculated_amount, expected, product.handle + ' ' + variant.title + ' ' + region.currency_code)
        assert(expected > 0)
        checked++
      }
    }
    after.push({ currency: region.currency_code, regionId: region.id, products })
    console.log(region.currency_code.toUpperCase() + ': all 11 variant prices available and correct')
  }
  assert.equal(checked, 132)
  fs.writeFileSync(live ? 'output/qa/pricing-after-premium.json' : 'output/qa/pricing-local-after-premium.json', JSON.stringify(after, null, 2))
  console.log('Verified 132 prices across 12 markets; exact 100% increase for all existing prices; inventory, photos and variants preserved')
})().catch(error => { console.error(error); process.exit(1) })
