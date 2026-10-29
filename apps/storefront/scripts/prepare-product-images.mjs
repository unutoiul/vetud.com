import { mkdir, readdir, stat } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import sharp from "sharp"

const root = fileURLToPath(new URL("../../../", import.meta.url))
const source = path.join(root, "assets/vetud_product_white_background")
const destination = path.join(root, "apps/storefront/public/images/products")
await mkdir(destination, { recursive: true })

let originalBytes = 0
let optimizedBytes = 0
for (const filename of (await readdir(source)).filter(name => name.endsWith(".png"))) {
  const product = filename.startsWith("VETUD-NAD-Plus-") ? "nad-plus" : filename.split("-")[1].toLowerCase()
  const view = filename.includes("Closed-Box") ? "closed" : filename.includes("Open-Box") ? "open" : filename.includes("Spray-Box-Left") ? "front" : "alternate"
  const input = path.join(source, filename)
  const output = path.join(destination, `${product}-${view}.webp`)
  const result = await sharp(input).webp({ quality: 88, effort: 6 }).toFile(output)
  originalBytes += (await stat(input)).size
  optimizedBytes += result.size
  console.log(`${path.basename(output)}: ${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB`)
}
console.log(`Total: ${Math.round(originalBytes / 1024)} KB → ${Math.round(optimizedBytes / 1024)} KB`)
