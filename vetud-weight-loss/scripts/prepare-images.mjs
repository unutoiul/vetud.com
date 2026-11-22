// Copies VETUD's own product artwork into public/ as web-sized WebP.
// Sources live in the repo's assets/ folder and the shop's public/ folder; run again after the art changes.
// Usage: npm run images
import { copyFileSync, mkdirSync, rmSync } from "node:fs"
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
  ["assets/VETUD_Dual_Chamber_Video_and_Artwork/VETUD_Dual_Chamber_Explainer_poster.png", "explainer-poster.webp", 1600],
  ["vetud-shop/frontend/public/images/vetud-alpine-landscape.webp", "alpine.webp", 1920],
]

for (const [source, name, width] of images) {
  const info = await sharp(path.join(REPO, source))
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
    const edge = (x > 0 && !alpha[p - 1]) || (x < w - 1 && !alpha[p + 1]) || (p >= w && !alpha[p - w]) || (p < w * (h - 1) && !alpha[p + w])
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
  sharp(path.join(REPO, "assets/VETUD_Reusable_Dual_Chamber_Pen_poster.png")).extract({ left: 902, top: 110, width: 918, height: 780 }),
  "vetud-pen.webp",
  { threshold: 238 },
)


mkdirSync(path.join(ROOT, "public", "videos"), { recursive: true })
copyFileSync(
  path.join(REPO, "assets/VETUD_Dual_Chamber_Video_and_Artwork/VETUD_Dual_Chamber_Explainer_1080p.mp4"),
  path.join(ROOT, "public", "videos", "dual-chamber-explainer.mp4"),
)

mkdirSync(path.join(ROOT, "public", "brand"), { recursive: true })
for (const file of ["vetud-logo.svg", "vetud-logo-white.svg", "vetud-mark.svg"]) {
  copyFileSync(path.join(REPO, "vetud-shop/frontend/public/brand", file), path.join(ROOT, "public", "brand", file))
}
console.log("video and logos copied")
