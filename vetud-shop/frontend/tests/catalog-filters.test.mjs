import assert from "node:assert/strict"
import { test } from "node:test"
import { categoryFacets, filterByCategories, shopQuery } from "../src/lib/catalog-filters.ts"

const categories = [
  { id: "weight", handle: "weight-loss-research", name: "Weight Loss Research", metadata: { storefront_group: "research" } },
  { id: "cognitive", handle: "cognitive-enhancement-research", name: "Cognitive Enhancement Research", metadata: { storefront_group: "research" } },
  { id: "sleep", handle: "sleep-enhancement-research", name: "Sleep Enhancement Research", metadata: { storefront_group: "research" } },
  { id: "peptides", handle: "peptide-series", name: "Peptide Series" },
  { id: "supplies", handle: "lab-supplies", name: "Lab Supplies" },
]
const product = (id, ids) => ({ id, categories: ids.map(id => ({ id })) })
const products = [product("pen", ["weight", "peptides"]), product("spray", ["cognitive", "peptides"]), product("water", ["supplies"])]
const facets = categoryFacets(categories, products)
const ids = selected => filterByCategories(products, facets, selected).map(product => product.id)

test("selecting several research areas includes products in either area", () => {
  assert.deepEqual(ids(["weight-loss-research", "cognitive-enhancement-research"]), ["pen", "spray"])
})
test("research area and product type must both match", () => {
  assert.deepEqual(ids(["weight-loss-research", "lab-supplies"]), [])
  assert.deepEqual(ids(["weight-loss-research", "peptide-series"]), ["pen"])
})
test("legacy category links and unfiltered catalogs keep working", () => {
  assert.deepEqual(ids(["peptide-series"]), ["pen", "spray"])
  assert.deepEqual(ids([]), ["pen", "spray", "water"])
})
test("empty and unknown categories return an empty result, not the entire catalog", () => {
  assert.equal(facets.find(category => category.id === "sleep").count, 0)
  assert.deepEqual(ids(["sleep-enhancement-research"]), [])
  assert.deepEqual(ids(["unknown"]), [])
})
test("counts are per product and repeated selections do not duplicate results", () => {
  const counts = categoryFacets(categories, [product("one", ["peptides", "peptides"])])
  assert.equal(counts.find(category => category.id === "peptides").count, 1)
  assert.deepEqual(ids(["weight-loss-research", "weight-loss-research"]), ["pen"])
})
test("shareable URLs retain multiple categories, search and sorting", () => {
  const query = new URLSearchParams(shopQuery({ query: "Selank & Semax", sort: "price-asc", categories: ["peptide-series", "cognitive-enhancement-research", "peptide-series"] }))
  assert.equal(query.get("q"), "Selank & Semax")
  assert.equal(query.get("sort"), "price-asc")
  assert.deepEqual(query.getAll("category"), ["peptide-series", "cognitive-enhancement-research"])
  assert.equal(shopQuery({ categories: [] }), "")
})
