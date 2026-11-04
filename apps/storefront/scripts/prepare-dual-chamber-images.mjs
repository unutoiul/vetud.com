import { existsSync } from "node:fs"
import { copyFile, mkdir, readdir, stat } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import sharp from "sharp"

// Turns the owner's dual-chamber, vial and pen artwork into the storefront's product photos, and
// copies the explainer video. Run with `node scripts/prepare-dual-chamber-images.mjs`.
const root = fileURLToPath(new URL("../../../", import.meta.url))
const assets = path.join(root, "assets")
const products = path.join(root, "apps/storefront/public/images/products")
const videos = path.join(root, "apps/storefront/public/videos")
await mkdir(products, { recursive: true })
await mkdir(videos, { recursive: true })

/** Label names in the artwork filenames → product handles. */
const HANDLES = {
  "5-Amino-1MQ": "5-amino-1mq",
  "AOD-9604": "aod-9604",
  "ARA-290": "ara-290",
  "BPC-157": "bpc-157",
  "CJC-1295_Ipamorelin_No-DAC": "cjc-1295-ipamorelin",
  DSIP: "dsip",
  "GHK-Cu": "ghk-cu",
  GLOW_Blend: "glow-blend",
  Glutathione: "glutathione",
  H2O: "bacteriostatic-water",
  "IGF-1_LR3": "igf-1-lr3",
  Ipamorelin: "ipamorelin",
  KLOW_Blend: "klow-blend",
  KPV: "kpv",
  "MOTS-c": "mots-c",
  "Melanotan-II_MT-2": "melanotan-ii",
  "Melanotan-I_MT-1": "melanotan-i",
  "NAD-Plus": "nad-plus",
  "PT-141": "pt-141",
  Retatrutide: "retatrutide",
  "SM-1": "semaglutide",
  "SS-31": "ss-31",
  Selank: "selank",
  Semax: "semax",
  "TB-500": "tb-500",
  "TZ-2": "tirzepatide",
  Tesamorelin: "tesamorelin",
  Wolverine_Blend: "wolverine-blend",
}

let written = 0
async function photo(input, name, width = 1200) {
  const output = path.join(products, name)
  const result = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 86, effort: 6 }).toFile(output)
  written += result.size
  console.log(`${name}: ${result.width} × ${result.height}, ${Math.round(result.size / 1024)} KB`)
}

const found = new Set()
const pens = path.join(assets, "VETUD_Dual_Chamber_28_Products")
for (const filename of (await readdir(pens)).filter(name => name.endsWith(".png"))) {
  const label = filename.replace("_VETUD_Dual-Chamber.png", "")
  const handle = HANDLES[label]
  if (!handle) throw new Error(`No handle for ${filename}`)
  await photo(path.join(pens, filename), `${handle}-pen.webp`)
  found.add(`${handle}-pen`)
}
const vials = path.join(assets, "VETUD_Research_Vials_No_Dosage")
/** Newer vial artwork that replaces a product's numbered file in the set. */
const VIAL_REPLACEMENTS = { "bacteriostatic-water": "VETUD BAC WATER vial.png" }
const replacements = new Set(Object.values(VIAL_REPLACEMENTS))
for (const filename of (await readdir(vials)).filter(name => name.endsWith(".png") && !replacements.has(name))) {
  const label = filename.replace(/^\d+_VETUD_/, "").replace(".png", "")
  const handle = HANDLES[label]
  if (!handle) throw new Error(`No handle for ${filename}`)
  await photo(path.join(vials, VIAL_REPLACEMENTS[handle] ?? filename), `${handle}-vial.webp`)
  found.add(`${handle}-vial`)
}
for (const handle of Object.values(HANDLES)) {
  for (const view of ["pen", "vial"]) if (!found.has(`${handle}-${view}`)) throw new Error(`Missing ${view} artwork for ${handle}`)
}

// Lab supplies sold next to the pens and vials.
const SUPPLY_PHOTOS = {
  "u-100-syringes-box": "VETUD Ten-Syringe Box Concept.png",
  "u-100-syringes-single": "VETUD Single U-100 Syringe.png",
}
for (const [name, filename] of Object.entries(SUPPLY_PHOTOS)) await photo(path.join(assets, filename), `${name}.webp`)

// The reusable pen, for the dual-chamber guide page.
await photo(path.join(assets, "Reusable dual-chamber peptide pen.png"), "reusable-dual-chamber-pen.webp")

const explainer = path.join(assets, "Premium dual-chamber laboratory pen concept.png")
await photo(explainer, "dual-chamber-pen.webp")

// The video's poster: its title frame (exported from the video at 4.5 s), or else the explainer
// artwork centred on the video's 16:9 frame.
const titleFrame = path.join(assets, "VETUD_Dual_Chamber_Video_and_Artwork/VETUD_Dual_Chamber_Explainer_poster.png")
const poster = existsSync(titleFrame)
  ? sharp(titleFrame).resize({ width: 1920 })
  : sharp({ create: { width: 1920, height: 1080, channels: 3, background: "#eef4fb" } })
    .composite([{ input: await sharp(explainer).resize({ height: 1080 }).toBuffer(), gravity: "center" }])
await poster.webp({ quality: 84 }).toFile(path.join(videos, "dual-chamber-explainer.webp"))

const video = path.join(assets, "VETUD_Dual_Chamber_Video_and_Artwork/VETUD_Dual_Chamber_Explainer_1080p.mp4")
await copyFile(video, path.join(videos, "dual-chamber-explainer.mp4"))
console.log(`Photos: ${Math.round(written / 1024)} KB. Video: ${Math.round((await stat(video)).size / 1024)} KB.`)
