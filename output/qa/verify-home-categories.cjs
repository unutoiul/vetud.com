const assert = require("node:assert/strict")
const fs = require("node:fs/promises")
const path = require("node:path")
const { promisify } = require("node:util")
const { execFile } = require("node:child_process")
const run = promisify(execFile)
const deployment = process.argv[2]
const cli = path.join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js")
const expected = [
  { handle: "weight-loss-research", name: "Weight Loss Research" },
  { handle: "sleep-enhancement-research", name: "Sleep Enhancement Research" },
  { handle: "longevity-anti-aging-research", name: "Longevity and Anti-aging Research" },
]

async function getPage(route) {
  let html
  if (deployment) {
    const { stdout } = await run(process.execPath, [cli, "curl", route, "--deployment", deployment, "--scope", "gold-structure-engine", "--", "--fail", "--silent", "--show-error", "--max-time", "30"], { maxBuffer: 8 * 1024 * 1024, timeout: 45000 })
    html = stdout
  } else {
    const response = await fetch(`https://www.vetud.com${route}`, { signal: AbortSignal.timeout(30000) })
    assert.equal(response.status, 200, route)
    html = await response.text()
  }
  return html.replace(/<!--[^]*?-->/g, "")
}

async function main() {
  const routes = []
  for (const country of ["gb", "us"]) {
    const html = await getPage(`/${country}`)
    const panel = html.match(/<nav\b[^>]*aria-label="Featured research categories"[^]*?<\/nav>/)?.[0]
    assert(panel, `Category navigation is server-rendered: ${country}`)
    const links = [...panel.matchAll(/<a\b[^>]*data-pathway="([^"]+)"[^]*?<\/a>/g)]
    assert.deepEqual(links.map(link => link[1]), expected.map(item => item.handle), "The three requested categories, in order")
    for (const [index, item] of expected.entries()) {
      const link = links[index][0]
      const href = link.match(/\bhref="([^"]+)"/)?.[1]
      assert.equal(href, `/${country}/shop?category=${item.handle}`)
      assert(link.includes(`aria-labelledby="pathway-${item.handle}-title"`))
      assert(link.includes(`aria-describedby="pathway-${item.handle}-description"`))
      assert(link.includes(`id="pathway-${item.handle}-title"`))
      assert(link.includes(item.name), "Database category name is visible")
      const detail = link.match(new RegExp(`id="pathway-${item.handle}-description"[^>]*>([^<]+)<`))?.[1]
      if (country === "gb") {
        const shop = await getPage(href)
        const productCount = [...shop.matchAll(/<article\b[^]*?<\/article>/g)].length
        assert.equal(detail, productCount ? `${productCount} ${productCount === 1 ? "product" : "products"} to explore` : "Coming soon", "Card count matches published products")
        const checkbox = [...shop.matchAll(/<input\b[^>]*>/g)].find(match => match[0].includes('type="checkbox"') && match[0].includes(`value="${item.handle}"`))?.[0]
        assert(checkbox && /\bchecked(?:="[^"]*")?(?:\s|\/>|>)/.test(checkbox), "The destination selects the correct category")
        if (!productCount) assert(shop.includes("No products in these categories yet."))
        routes.push({ route: href, products: productCount })
      }
    }
    routes.push({ route: `/${country}`, categories: expected.map(item => item.handle) })
    console.log(`PASS /${country}: correct category labels, country-aware links, and availability`)
  }
  await fs.writeFile(`output/qa/home-categories-${deployment ? "staged" : "live"}.json`, JSON.stringify({ checkedAt: new Date().toISOString(), deployment: deployment || "https://www.vetud.com", routes }, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
