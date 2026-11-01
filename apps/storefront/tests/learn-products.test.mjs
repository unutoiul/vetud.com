import assert from "node:assert/strict"
import { test } from "node:test"
import { matchesPeptide, researchAvailability } from "../src/lib/learn-products.ts"

const variant = (extra = {}) => ({ manage_inventory: true, allow_backorder: false, inventory_quantity: 0, calculated_price: { calculated_amount: 100 }, ...extra })
const product = (variants, extra = {}) => ({ id: "p1", handle: "semax", title: "Semax", variants, ...extra })

test("unpriced or unknown inventory cannot produce a false in-stock claim", () => {
  assert.equal(researchAvailability(product([variant({ inventory_quantity: 50, calculated_price: null })])), "unavailable")
  assert.equal(researchAvailability(product([variant({ inventory_quantity: undefined })])), "unavailable")
  assert.equal(researchAvailability(product([])), "unavailable")
  assert.equal(researchAvailability(product([variant({ inventory_quantity: 50, calculated_price: { calculated_amount: NaN } })])), "unavailable")
})
test("regional stock is based on a purchasable strength, not the first variant", () => {
  assert.equal(researchAvailability(product([variant(), variant({ inventory_quantity: 2 })])), "in_stock")
  assert.equal(researchAvailability(product([variant(), variant()])), "out_of_stock")
})
test("backorders and unmanaged inventory are available to order without claiming physical stock", () => {
  assert.equal(researchAvailability(product([variant({ allow_backorder: true })])), "available_to_order")
  assert.equal(researchAvailability(product([variant({ manage_inventory: false })])), "available_to_order")
})
test("catalog matching avoids guessing identities for generic series and blends", () => {
  assert.equal(matchesPeptide(product([], { handle: "peptide-series-01", title: "Tesamorelin blend" }), "tesamorelin"), false)
  assert.equal(matchesPeptide(product([], { handle: "semax-blend" }), "semax"), false)
  assert.equal(matchesPeptide(product([], { handle: "GHK-Cu" }), "ghk-cu"), true)
  assert.equal(matchesPeptide(product([], { handle: "spray", metadata: { named_peptide: "Semax" } }), "semax"), true)
  assert.equal(matchesPeptide(product([], { handle: "blend", metadata: { learn_peptides: ["semax", "selank"] } }), "selank"), true)
})
