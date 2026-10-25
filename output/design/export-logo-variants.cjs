const fs = require("node:fs/promises")
const path = require("node:path")
const sharp = require("../../apps/storefront/node_modules/sharp")

async function main() {
  const dir = path.resolve(__dirname, "../../apps/storefront/public/brand/variants")
  const names = (await fs.readdir(dir)).filter(name => name.endsWith(".svg"))
  for (const name of names) {
    const width = name.includes("-mark-") ? 1152 : 2400
    await sharp(path.join(dir, name)).resize({ width }).png().toFile(path.join(dir, name.replace(/\.svg$/, ".png")))
  }
  const tiles = []
  for (const [index, name] of ["navy", "blue", "sage", "white"].entries()) {
    const input = await sharp(path.join(dir, `vetud-logo-on-${name}.svg`)).resize(800, 320).png().toBuffer()
    tiles.push({ input, left: (index % 2) * 800, top: Math.floor(index / 2) * 320 })
  }
  await sharp({ create: { width: 1600, height: 640, channels: 4, background: "#ffffff" } })
    .composite(tiles).png().toFile(path.join(__dirname, "vetud-logo-background-variants.png"))
  console.log(`Exported ${names.length} PNGs and the comparison preview.`)
}

main().catch(error => { console.error(error); process.exit(1) })
