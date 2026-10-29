const assert = require("node:assert/strict")
const fs = require("node:fs/promises")
const path = require("node:path")
const { execFile } = require("node:child_process")
const { promisify } = require("node:util")
const run = promisify(execFile)
const sharp = require("../../apps/storefront/node_modules/sharp")
const handles = ["retatrutide", "tirzepatide", "semaglutide", "selank", "semax"]
const mode = process.argv[2] || "local"
const deployment = process.argv[3]
const cli = path.join(process.env.APPDATA, "npm/node_modules/vercel/dist/vc.js")
const base = mode === "local" ? "http://localhost:8000" : "https://www.vetud.com"
const baselinePath = "output/qa/white-background-baseline.json"

async function page(route) {
  if (deployment) {
    const { stdout } = await run(process.execPath, [cli, "curl", route, "--deployment", deployment, "--scope", "gold-structure-engine", "--", "--fail", "--silent", "--show-error", "--max-time", "30"], { maxBuffer: 8 * 1024 * 1024, timeout: 45000 })
    return stdout
  }
  const response = await fetch(base + route, { signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, route)
  return response.text()
}

async function main() {
  const products = []
  for (const handle of handles) {
    const html = await page(`/gb/products/${handle}`)
    const json = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
    assert(json, `Product schema missing: ${handle}`)
    const schema = JSON.parse(json[1])
    const { name, sku, description, offers } = schema
    products.push({ handle, name, sku, description, offers })
    if (mode !== "baseline") {
      const views = ["selank", "semax"].includes(handle) ? ["front", "alternate"] : ["closed", "open"]
      for (const view of views) assert(html.includes(`/images/products/${handle}-${view}.webp`), `Missing ${handle} ${view}`)
      assert.equal(schema.image.length, 2)
      assert(html.includes('object-fit:contain'))
      assert(html.includes('aria-pressed="true"'))
      assert(html.includes('aria-pressed="false"'))
      assert(html.includes('sizes="(max-width: 600px) 90vw'))
    }
  }
  if (mode === "baseline") {
    await fs.writeFile(baselinePath, JSON.stringify(products, null, 2))
    console.log("Recorded live names, SKUs, descriptions, prices and availability for five products.")
    return
  }
  const before = JSON.parse(await fs.readFile(baselinePath, "utf8"))
  assert.deepEqual(products, before, "Commercial product details changed")
  for (const route of ["/gb", "/gb/shop"]) {
    const html = await page(route)
    for (const handle of handles) {
      const imagePath = `/images/products/${handle}-`
      assert(html.includes(imagePath) || html.includes(encodeURIComponent(imagePath)), `Missing ${handle} on ${route}`)
    }
    assert(html.includes('object-fit:contain'))
  }
  const assets = await fs.readdir("apps/storefront/public/images/products")
  for (const asset of assets) {
    const route = `/images/products/${asset}`
    if (deployment) {
      const output = path.resolve("output/qa", `delivered-${asset}`)
      await run(process.execPath, [cli, "curl", route, "--deployment", deployment, "--scope", "gold-structure-engine", "--", "--fail", "--silent", "--show-error", "--output", output], { maxBuffer: 1024 * 1024 })
      assert.deepEqual(await fs.readFile(output), await fs.readFile(`apps/storefront/public${route}`))
      await fs.unlink(output)
    } else {
      const response = await fetch(base + route)
      assert.equal(response.status, 200, route)
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), await fs.readFile(`apps/storefront/public${route}`))
    }
  }
  const optimizedImages = []
  if (!deployment) {
    for (const [handle, view, ratio] of [["retatrutide", "closed", 3 / 4], ["selank", "front", 1402 / 1122]]) {
      for (const width of [384, 1080]) {
        const route = `/_next/image?url=${encodeURIComponent(`/images/products/${handle}-${view}.webp`)}&w=${width}&q=75`
        const response = await fetch(base + route, { headers: { Accept: "image/webp" }, signal: AbortSignal.timeout(30000) })
        assert.equal(response.status, 200, route)
        assert(response.headers.get("content-type").includes("image/"))
        const bytes = Buffer.from(await response.arrayBuffer())
        const metadata = await sharp(bytes).metadata()
        assert.equal(metadata.width, width)
        assert(Math.abs(metadata.height - width * ratio) <= 1, "Image proportions changed")
        assert(bytes.length < 500 * 1024)
        optimizedImages.push({ handle, width, height: metadata.height, bytes: bytes.length, format: metadata.format })
      }
    }
  }
  const report = { checkedAt: new Date().toISOString(), mode, deployment, products: products.length, productPhotos: assets.length, routes: 7, checks: ["two approved views per product", "responsive image sizes", "contained photography", "selected thumbnail state", "homepage and catalog images", "all ten delivered file hashes", "unchanged names, SKUs, descriptions, prices and availability"], optimizedImages, visualReview: "Unavailable: Computer Use could not verify the current browser URL." }
  await fs.writeFile(`output/qa/white-background-${mode}.json`, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
