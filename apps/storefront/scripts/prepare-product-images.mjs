import { mkdir, readdir, stat } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import sharp from "sharp"

// Turns the owner's white-background box photography into storefront photos:
// "VETUD-Tirzepatide-40mg-Open-Box.png" → tirzepatide-open.webp, the unlabelled
// "VETUD-Generic-VETUD-Open-Box.png" → generic-open.webp and the blue Peptide Series box
// "VETUD-Generic-VETUD-Closed-Box.png" → generic-closed.webp. Run with `node scripts/prepare-product-images.mjs`.
const root = fileURLToPath(new URL("../../../", import.meta.url))
const source = path.join(root, "assets/vetud_product_white_background")
const destination = path.join(root, "apps/storefront/public/images/products")
await mkdir(destination, { recursive: true })

const outputName = (filename) => {
  const product = filename.startsWith("VETUD-NAD-Plus-") ? "nad-plus" : filename.split("-")[1].toLowerCase()
  const view = filename.includes("Closed-Box") ? "closed" : filename.includes("Open-Box") ? "open" : filename.includes("Spray-Box-Left") ? "front" : "alternate"
  return `${product}-${view}.webp`
}

// The open boxes with the printed instruction guide (2026-11-04) replace the earlier
// "-Open-Box-12-Needles-…" artwork of the same product.
const files = (await readdir(source)).filter(name => name.endsWith(".png"))
const chosen = new Map()
for (const filename of files) {
  const name = outputName(filename)
  const current = chosen.get(name)
  if (!current || (current.includes("-Open-Box-12-Needles") && !filename.includes("-Open-Box-12-Needles"))) chosen.set(name, filename)
}

let originalBytes = 0
let optimizedBytes = 0
for (const [name, filename] of chosen) {
  const input = path.join(source, filename)
  const result = await sharp(input).webp({ quality: 88, effort: 6 }).toFile(path.join(destination, name))
  originalBytes += (await stat(input)).size
  optimizedBytes += result.size
  console.log(`${name} ← ${filename}: ${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB`)
}
console.log(`Total: ${Math.round(originalBytes / 1024)} KB → ${Math.round(optimizedBytes / 1024)} KB`)
