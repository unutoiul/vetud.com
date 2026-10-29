const assert = require("node:assert/strict")
const fs = require("node:fs/promises")
const path = require("node:path")
const { promisify } = require("node:util")
const { execFile } = require("node:child_process")
const run = promisify(execFile)
const deployment = process.argv[2]
const cli = path.join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js")

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
  const cases = [
    { route: "/gb/shop", count: 14, sort: "Featured" },
    { route: "/gb/shop?category=weight-loss-research&sort=price-asc", count: 3, sort: "Price: low to high", products: ["retatrutide", "tirzepatide", "semaglutide"] },
    { route: "/gb/shop?q=Semax&category=cognitive-enhancement-research&sort=name", count: 1, sort: "Name", products: ["semax"] },
    { route: "/gb/shop?category=beauty", count: 0, sort: "Featured", products: [] },
    { route: "/us/shop", count: 14, sort: "Featured" },
  ]
  const routes = []
  for (const item of cases) {
    const html = (await getPage(item.route)).replace(/<!--[^]*?-->/g, "")
    const form = html.match(/<form\b[^>]*role="search"[^]*?<\/form>/)?.[0]
    assert(form, `Search landmark: ${item.route}`)
    assert(form.includes('method="get"'))
    assert(form.includes(`action="${item.route.split("?")[0]}"`))
    assert(/<label\b[^>]*for="catalog-search"[^>]*>Search products<\/label>/.test(form), "Visible search label")
    const searchInput = [...form.matchAll(/<input\b[^>]*>/g)].find(match => match[0].includes('id="catalog-search"'))?.[0]
    assert(searchInput?.includes('name="q"'), "Search label is associated with the query input")
    assert.equal((form.match(/<svg\b/g) || []).length, 1, "Only one search icon")
    assert(/<button\b[^>]*type="submit"[^>]*>[^]*?Search<\/button>/.test(form), "Search submit button")
    assert(/<span\b[^>]*id="catalog-sort-label"[^>]*>Sort by<\/span>/.test(html), "Visible sort label")
    const sort = html.match(/<div\b[^>]*role="combobox"[^>]*id="catalog-sort"[^>]*>([^]*?)<\/div>/)
    assert(sort && sort[0].includes('aria-labelledby="catalog-sort-label"'), "Sort has an associated visible label")
    assert.equal(sort[1], item.sort)
    assert(new RegExp(`aria-live="polite"[^>]*>${item.count} ${item.count === 1 ? "product" : "products"}<`).test(html), "Correct live results count")
    const products = [...html.matchAll(/<article\b[^]*?<\/article>/g)].map(match => match[0].match(/href="\/(?:gb|us)\/products\/([^"?#]+)"/)?.[1]).filter(Boolean)
    assert.equal(products.length, item.count)
    if (item.products) assert.deepEqual([...products].sort(), [...item.products].sort())
    const query = new URL(item.route, "https://www.vetud.com").searchParams
    for (const category of query.getAll("category")) assert(form.includes(`name="category" value="${category}"`), "Search retains categories")
    if (query.has("sort")) assert(form.includes(`name="sort" value="${query.get("sort")}"`), "Search retains sorting")
    if (query.has("q")) assert(searchInput.includes('value="Semax"'), "Search retains the current query")
    if (query.size) assert(html.includes("Clear filters"))
    if (!item.count) assert(html.includes("Choose another research area or browse the full collection."))
    routes.push({ route: item.route, products: products.length, sort: item.sort })
    console.log(`PASS ${item.route}: ${products.length} products`)
  }
  const report = { checkedAt: new Date().toISOString(), deployment: deployment || "https://www.vetud.com", routes, visualReview: "Browser access host unavailable; browser interaction and visual verification were not performed." }
  await fs.writeFile(`output/qa/shop-toolbar-${deployment ? "staged" : "live"}.json`, JSON.stringify(report, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
