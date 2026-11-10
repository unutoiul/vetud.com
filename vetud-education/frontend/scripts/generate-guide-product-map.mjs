// Writes src/content/learn/guide-product-map.json: which shop product each guide links to.
// Run when the shop's catalog changes:
//   SHOP_BACKEND_URL=... SHOP_PUBLISHABLE_KEY=... node scripts/generate-guide-product-map.mjs
import { readFileSync, writeFileSync } from "node:fs"

const backend = (process.env.SHOP_BACKEND_URL ?? "").replace(/\/$/, "")
const key = process.env.SHOP_PUBLISHABLE_KEY
if (!backend || !key) throw new Error("Set SHOP_BACKEND_URL and SHOP_PUBLISHABLE_KEY.")

const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "")

/** Its own product (3), named after it (2), about it alone (1), or a blend that includes it (0.5). */
function rank(product, slug) {
  if (normalize(product.handle ?? "") === normalize(slug)) return 3
  const named = product.metadata?.named_peptide
  if (typeof named === "string" && normalize(named) === normalize(slug)) return 2
  const topics = product.metadata?.learn_peptides
  if (!Array.isArray(topics) || !topics.includes(slug)) return 0
  return topics.length === 1 ? 1 : 0.5
}

const source = readFileSync(new URL("../src/content/learn/peptides.ts", import.meta.url), "utf8")
const slugs = [...source.matchAll(/^\s*slug: "([a-z0-9-]+)"/gm)].map((match) => match[1])
if (!slugs.length) throw new Error("No guide slugs found in peptides.ts.")

const response = await fetch(`${backend}/store/products?limit=500&fields=handle,%2Bmetadata`, { headers: { "x-publishable-api-key": key } })
if (!response.ok) throw new Error(`Store API ${response.status}`)
const { products } = await response.json()

const map = {}
for (const slug of slugs) {
  const best = products.map((product) => ({ handle: product.handle, score: rank(product, slug) })).filter((match) => match.score > 0).sort((a, b) => b.score - a.score || a.handle.localeCompare(b.handle))[0]
  if (best) map[slug] = best.handle
}

writeFileSync(new URL("../src/content/learn/guide-product-map.json", import.meta.url), `${JSON.stringify(map, null, 2)}\n`)
console.log(`${Object.keys(map).length} of ${slugs.length} guides link to a product`)
