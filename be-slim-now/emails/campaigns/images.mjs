// Makes the pictures for the email campaigns in campaigns/: JPEGs (Outlook doesn't show WebP), sized
// for a 600 px email at 2x. They're served by the site from public/brand/email/campaign/, so they must
// be deployed before a campaign is sent.
// Usage: npm run emails:campaign-images
import { mkdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const IMAGES = path.join(ROOT, "public", "images")
const OUT = path.join(ROOT, "public", "brand", "email", "campaign")
mkdirSync(OUT, { recursive: true })

const jpeg = { quality: 80, mozjpeg: true, chromaSubsampling: "4:4:4" }

// Hero: the reusable pen over the alpine landscape, 1200 × 640.
{
  const width = 1200
  const height = 640
  const background = await sharp(path.join(IMAGES, "alpine.webp")).resize(width, height, { fit: "cover", position: "bottom" }).toBuffer()
  const pen = await sharp(path.join(IMAGES, "vetud-pen.webp")).resize({ height: 560 }).png().toBuffer()
  const { width: penWidth } = await sharp(pen).metadata()
  await sharp(background)
    .composite([{ input: pen, left: Math.round((width - penWidth) / 2), top: 40 }])
    .jpeg(jpeg)
    .toFile(path.join(OUT, "hero-pen.jpg"))
}

// The two closed boxes, trimmed to the box and padded on white, 560 wide.
for (const name of ["tirzepatide", "retatrutide"]) {
  const trimmed = await sharp(path.join(IMAGES, `${name}-closed.webp`)).trim({ background: "#ffffff", threshold: 12 }).toBuffer()
  await sharp(trimmed)
    .resize(520, 270, { fit: "contain", background: "#ffffff" })
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .jpeg(jpeg)
    .toFile(path.join(OUT, `${name}-box.jpg`))
}

// The dual-chamber diagram, 560 square.
await sharp(path.join(IMAGES, "pen-diagram.webp")).resize(560, 560).jpeg(jpeg).toFile(path.join(OUT, "pen-diagram.jpg"))

for (const file of ["hero-pen.jpg", "tirzepatide-box.jpg", "retatrutide-box.jpg", "pen-diagram.jpg"]) {
  const meta = await sharp(path.join(OUT, file)).metadata()
  console.log(`${file}  ${meta.width}×${meta.height}  ${Math.round(statSync(path.join(OUT, file)).size / 1024)} KB`)
}
