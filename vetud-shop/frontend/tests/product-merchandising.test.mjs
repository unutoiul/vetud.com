import assert from "node:assert/strict"
import { test } from "node:test"
import { productMerchandising, merchandisingPriority } from "../src/lib/product-merchandising.ts"
import { PRODUCT_MERCHANDISING, withMerchandisingDefaults, withExpandedMerchandising } from "../../backend/src/lib/product-merchandising.ts"

test("labels are independent and false metadata cannot accidentally enable a badge", () => {
  for (const veryPopular of [false, true]) {
    for (const bestSeller of [false, true]) {
      for (const asText of [false, true]) {
        const metadata = { very_popular: asText ? String(veryPopular) : veryPopular, best_seller: asText ? String(bestSeller) : bestSeller }
        assert.deepEqual(productMerchandising({ metadata }), { veryPopular, bestSeller })
      }
    }
  }
  for (const metadata of [null, undefined, {}, { very_popular: "yes", best_seller: 1 }]) {
    assert.deepEqual(productMerchandising({ metadata }), { veryPopular: false, bestSeller: false })
  }
})

test("store defaults reach the UI; rerunning the import respects Admin edits", () => {
  for (const handle of ["retatrutide", "tirzepatide", "semaglutide", "melanotan-ii", "bpc-157", "ghk-cu"]) {
    const metadata = withMerchandisingDefaults(handle, { code: "KEEP", lots: "existing-lot" })
    assert.deepEqual(productMerchandising({ metadata }), { veryPopular: true, bestSeller: true })
    assert.equal(metadata.code, "KEEP")
    assert.equal(metadata.lots, "existing-lot")
    assert.deepEqual(withMerchandisingDefaults(handle, metadata), metadata)
    const edited = { ...metadata, best_seller: false, very_popular: "false" }
    assert.deepEqual(withMerchandisingDefaults(handle, edited), edited)
  }
  assert.deepEqual(withMerchandisingDefaults("unknown", { code: "KEEP" }), { code: "KEEP" })
})

test("both labels lead the collection without turning popularity into a best-seller claim", () => {
  const reta = { metadata: PRODUCT_MERCHANDISING.retatrutide }
  const tb500 = { metadata: PRODUCT_MERCHANDISING["tb-500"] }
  assert.equal(productMerchandising(tb500).bestSeller, false)
  assert.ok(merchandisingPriority(reta) > merchandisingPriority(tb500))
  assert.ok(merchandisingPriority(tb500) > merchandisingPriority({}))
})

test("expanded selection upgrades the previous false flag once and preserves later Admin edits", () => {
  const old = { very_popular: true, best_seller: false, lots: "existing-lot" }
  const upgraded = withExpandedMerchandising("semaglutide", old)
  assert.deepEqual(productMerchandising({ metadata: upgraded }), { veryPopular: true, bestSeller: true })
  assert.equal(upgraded.lots, old.lots)
  const edited = { ...upgraded, best_seller: false }
  assert.equal(withExpandedMerchandising("semaglutide", edited), edited)
  assert.equal(withExpandedMerchandising("unknown", old), old)
})
