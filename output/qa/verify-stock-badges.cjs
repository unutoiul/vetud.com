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
    return stdout.replace(/<!--[^]*?-->/g, "")
  }
  const response = await fetch(`https://www.vetud.com${route}`, { signal: AbortSignal.timeout(30000) })
  assert.equal(response.status, 200, route)
  return (await response.text()).replace(/<!--[^]*?-->/g, "")
}

function luminance(color) {
  assert(/^#[\da-f]{3}(?:[\da-f]{3})?$/i.test(color), "Expected a hex theme color")
  let hex = color.slice(1)
  if (hex.length === 3) hex = [...hex].map(value => value + value).join("")
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
}

function cards(html, country) {
  return [...html.matchAll(/<article\b[^]*?<\/article>/g)].flatMap(match => {
    const handle = match[0].match(new RegExp(`href="/${country}/products/([^"?#]+)"`))?.[1]
    if (!handle) return []
    const badges = [...match[0].matchAll(/<span\b[^>]*data-stock-status="([^"]+)"[^]*?<\/span>/g)]
    assert.equal(badges.length, 1, `One stock badge for ${handle}`)
    const status = badges[0][1]
    assert(badges[0][0].includes(status === "available" ? "Available" : "Sold out"), `Explicit stock text for ${handle}`)
    assert(badges[0][0].includes('aria-hidden="true"'), "Status icon is decorative beside its text")
    return [{ handle, status }]
  })
}

async function main() {
  const shop = await getPage("/gb/shop")
  const products = cards(shop, "gb")
  assert.equal(products.length, 14)
  const examples = ["available", "sold-out"].map(status => products.find(product => product.status === status))
  assert(examples.every(Boolean), "Verify both available and sold-out examples")
  const contrast = {}
  for (const name of ["success", "error"]) {
    const background = shop.match(new RegExp(`--mui-palette-${name}-main:([^;]+);`))?.[1]
    const foreground = shop.match(new RegExp(`--mui-palette-${name}-contrastText:([^;]+);`))?.[1]
    assert(background && foreground, "Rendered semantic palette variables")
    const values = [luminance(background), luminance(foreground)].sort((a, b) => a - b)
    contrast[name] = (values[1] + .05) / (values[0] + .05)
    assert(contrast[name] >= 4.5, `Readable ${name} text contrast`)
  }
  console.log(`PASS /gb/shop: ${products.length} stock badges; contrast ${Object.values(contrast).map(value => value.toFixed(2)).join(" / ")}:1`)
  const routes = [{ route: "/gb/shop", products: products.length }]
  for (const item of examples) {
    const route = `/gb/products/${item.handle}`
    const html = await getPage(route)
    const schema = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([^]*?)<\/script>/g)].map(match => JSON.parse(match[1])).find(value => value["@type"] === "Product")
    assert.equal(schema?.offers?.availability, `https://schema.org/${item.status === "available" ? "InStock" : "OutOfStock"}`, "Listing badge agrees with product availability")
    const liveStatus = html.match(/<div\b[^>]*role="status"[^>]*aria-live="polite"[^]*?<\/div>/)?.[0]
    assert(liveStatus?.includes(`data-stock-status="${item.status}"`), "Selected amount has the matching announced stock badge")
    const button = [...html.matchAll(/<button\b[^]*?<\/button>/g)].find(match => match[0].includes("Add to cart"))?.[0].match(/^<button\b[^>]*>/)?.[0]
    assert(button, "Purchase button is rendered")
    assert.equal(/\bdisabled(?:="[^"]*")?(?:\s|>)/.test(button), item.status === "sold-out", "Purchase button agrees with selected stock status")
    routes.push({ route, status: item.status })
    console.log(`PASS ${route}: ${item.status} badge and purchase state agree`)
  }
  for (const [route, country, expectedCount] of [["/gb", "gb", 3], ["/us/shop", "us", 14]]) {
    const listed = cards(await getPage(route), country)
    assert.equal(listed.length, expectedCount)
    for (const item of listed) assert.equal(item.status, products.find(product => product.handle === item.handle)?.status)
    routes.push({ route, products: listed.length })
    console.log(`PASS ${route}: ${listed.length} consistent stock badges`)
  }
  await fs.writeFile(`output/qa/stock-badges-${deployment ? "staged" : "live"}.json`, JSON.stringify({ checkedAt: new Date().toISOString(), deployment: deployment || "https://www.vetud.com", contrast, routes, products }, null, 2))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
