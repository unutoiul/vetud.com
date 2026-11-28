// Copies VETUD's own product artwork into public/ as web-sized WebP.
// Sources live in the repo's assets/ folder and the shop's public/ folder; run again after the art changes.
// Usage: npm run images
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const REPO = path.join(ROOT, "..")
const OUT = path.join(ROOT, "public", "images")
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const BOXES = "assets/vetud_product_white_background"
const images = [
  [`${BOXES}/VETUD-Tirzepatide-40mg-Closed-Box-White-Background.png`, "tirzepatide-closed.webp", 1400],
  [`${BOXES}/VETUD-Tirzepatide-40mg-Open-Box.png`, "tirzepatide-open.webp", 1400],
  [`${BOXES}/VETUD-Retatrutide-40mg-Closed-Box-White-Background.png`, "retatrutide-closed.webp", 1400],
  [`${BOXES}/VETUD-Retatrutide-40mg-Open-Box.png`, "retatrutide-open.webp", 1400],
  ["assets/VETUD_Dual_Chamber_Video_and_Artwork/VETUD_Dual_Chamber_Pen_Refined.png", "pen-diagram.webp", 1400],
  [
    "assets/VETUD_Dual_Chamber_Video_and_Artwork/VETUD_Dual_Chamber_Explainer_poster.png",
    "explainer-poster.webp",
    1600,
  ],
  ["vetud-shop/frontend/public/images/vetud-alpine-landscape.webp", "alpine.webp", 1920],
  // The molecules' artwork from the vetud.com hero: glass ribbons (Retatrutide) and the copper/teal loop (Tirzepatide).
  ["vetud-education/frontend/public/images/learn/spotlights/retatrutide.webp", "retatrutide-art.webp", 1440],
  ["vetud-education/frontend/public/images/learn/spotlights/tirzepatide.webp", "tirzepatide-art.webp", 1440],
]

/**
 * Text baked into an artwork that doesn't belong on a sales page, as boxes in source pixels. Each box
 * is repainted by blending, column by column, the clean row just above it into the clean row just below.
 */
const ERASE = {
  // "Cartridge placement concept" under the title, and "PACKAGING CONCEPT | vetud.com" in the navy band.
  "pen-diagram.webp": [
    { x0: 100, x1: 570, ya: 258, yb: 306 },
    { x0: 300, x1: 955, ya: 1186, yb: 1232 },
  ],
}

async function load(source, name) {
  const boxes = ERASE[name]
  if (!boxes) return sharp(source)
  const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, channels: n } = info
  for (const { x0, x1, ya, yb } of boxes) {
    for (let x = x0; x <= x1; x++) {
      const above = (ya * w + x) * n
      const below = (yb * w + x) * n
      for (let y = ya + 1; y < yb; y++) {
        const t = (y - ya) / (yb - ya)
        const at = (y * w + x) * n
        for (let c = 0; c < n; c++) data[at + c] = Math.round(data[above + c] * (1 - t) + data[below + c] * t)
      }
    }
  }
  return sharp(data, { raw: info })
}

for (const [source, name, width] of images) {
  const info = await (
    await load(path.join(REPO, source), name)
  )
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(OUT, name))
  console.log(`${name.padEnd(28)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`)
}

/**
 * Makes the light background that touches the edges transparent (a flood fill, so light parts inside
 * the outline stay as they are), so the object floats on any background.
 */
async function cutOut(input, name, { threshold = 236 } = {}) {
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const isBackground = (i) => Math.min(data[i], data[i + 1], data[i + 2]) >= threshold
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const p = stack.pop()
    if (seen[p]) continue
    seen[p] = 1
    if (!isBackground(p * 4)) continue
    data[p * 4 + 3] = 0
    const x = p % w
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (p >= w) stack.push(p - w)
    if (p < w * (h - 1)) stack.push(p + w)
  }
  // Soften the cut: pixels next to the removed background become half transparent.
  const alpha = Uint8Array.from({ length: w * h }, (_, p) => data[p * 4 + 3])
  for (let p = 0; p < w * h; p++) {
    if (!alpha[p]) continue
    const x = p % w
    const edge =
      (x > 0 && !alpha[p - 1]) ||
      (x < w - 1 && !alpha[p + 1]) ||
      (p >= w && !alpha[p - w]) ||
      (p < w * (h - 1) && !alpha[p + w])
    if (edge) data[p * 4 + 3] = 128
  }
  const out = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(path.join(OUT, name))
  console.log(`${name.padEnd(28)} ${out.width}x${out.height} ${(out.size / 1024).toFixed(0)} KB (cut out)`)
}

// The reusable VETUD pen, taken from its design-study poster (the pen only, without the text and mountains).
await cutOut(
  sharp(path.join(REPO, "assets/VETUD_Reusable_Dual_Chamber_Pen_poster.png")).extract({
    left: 902,
    top: 110,
    width: 918,
    height: 780,
  }),
  "vetud-pen.webp",
  { threshold: 238 },
)

/**
 * The owner's phone photos of the filling line and the cold store, given one calm, consistent look:
 * cropped clear of clutter at the edges, colour casts evened out (window blue, LED yellow), auto
 * levels, softer saturation, a little contrast and sharpening, and a faint vignette.
 */
const PHOTOS = "assets/VETUD_Facility_Photos"
const facility = [
  // The cleanroom filling line: a little warm, so a touch cooler.
  {
    source: "cleanroom-filling-line.jpg",
    name: "facility-cleanroom.webp",
    crop: { left: 120, top: 0, width: 1760, height: 1080 },
    gains: [0.97, 0.99, 1.04],
    saturation: 0.88,
    brightness: 1.03,
  },
  // One cabinet door, from the black frame to its LED strip: blue window light at the top, yellow LED at the side.
  {
    source: "cold-storage-shelves.jpg",
    name: "facility-cold-storage.webp",
    crop: { left: 385, top: 20, width: 525, height: 789 },
    gains: [0.95, 1, 1.02],
    saturation: 0.7,
    brightness: 1.04,
  },
  // The row of cabinets, without the half cabinet on the left and the packing bag on the right.
  {
    source: "cold-storage-cabinets.jpg",
    name: "facility-cabinets.webp",
    crop: { left: 58, top: 150, width: 970, height: 640 },
    gains: [0.98, 1, 1.03],
    saturation: 0.78,
    brightness: 1.06,
  },
]
const vignette = (width, height) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><radialGradient id="v" r="75%"><stop offset="55%" stop-opacity="0"/><stop offset="100%" stop-opacity="0.28"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/></svg>`,
  )
for (const {
  source,
  name,
  crop,
  gains: [r, g, b],
  saturation,
  brightness,
} of facility) {
  const graded = await sharp(path.join(REPO, PHOTOS, source))
    .extract(crop)
    .recomb([
      [r, 0, 0],
      [0, g, 0],
      [0, 0, b],
    ])
    .normalise({ lower: 1, upper: 99.5 })
    .modulate({ saturation, brightness })
    .linear(1.06, -6)
    .sharpen({ sigma: 0.8, m1: 0.6, m2: 1.2 })
    .toBuffer()
  const info = await sharp(graded)
    .composite([{ input: vignette(crop.width, crop.height), blend: "multiply" }])
    .webp({ quality: 84 })
    .toFile(path.join(OUT, name))
  console.log(`${name.padEnd(28)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB (graded photo)`)
}

mkdirSync(path.join(ROOT, "public", "videos"), { recursive: true })
copyFileSync(
  path.join(REPO, "assets/VETUD_Dual_Chamber_Video_and_Artwork/VETUD_Dual_Chamber_Explainer_1080p.mp4"),
  path.join(ROOT, "public", "videos", "dual-chamber-explainer.mp4"),
)

mkdirSync(path.join(ROOT, "public", "brand"), { recursive: true })
for (const file of ["vetud-logo.svg", "vetud-logo-white.svg", "vetud-mark.svg"]) {
  // The kit's lettering is a hairline that breaks up at header size on 1x screens. A thin stroke in
  // the letter colour gives it a screen weight without changing the shapes.
  const svg = readFileSync(path.join(REPO, "vetud-shop/frontend/public/brand", file), "utf8").replace(
    /<g id="outlined-lettering" fill="(#[0-9A-Fa-f]{6})"/,
    '<g id="outlined-lettering" fill="$1" stroke="$1" stroke-width="0.55" stroke-linejoin="round"',
  )
  writeFileSync(path.join(ROOT, "public", "brand", file), svg)
}
console.log("video and logos copied")
