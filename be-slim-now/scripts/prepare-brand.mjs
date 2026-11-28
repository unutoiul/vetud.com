// Builds every BeSlimNow logo and icon the site uses from one file of the owner's logo kit, so the
// header, the footer, the browser tab and the home-screen icon all show the very same B.
// Run again after the kit changes. Usage: npm run brand
//
// Source: public/logos/recommended-04-premium/full-logo-trimmed.png
// - public/brand/beslimnow-logo.png        the logo for light backgrounds (header, emails)
// - public/brand/beslimnow-logo-white.png  the same with "Be" and "Now" in white (footer)
// - public/brand/email/beslimnow-logo.png  the logo on white for emails
// - public/brand/icon-192.png, icon-512.png  home-screen icons (src/app/manifest.ts)
// - src/app/favicon.ico                    the browser-tab icon: 16, 32 and 48 px
// - src/app/apple-icon.png                 iPhone home screen, 180 px
import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE = path.join(ROOT, "public/logos/recommended-04-premium/full-logo-trimmed.png")
const BRAND = path.join(ROOT, "public/brand")

/** Logo width in pixels: about three times its widest use on the page. */
const LOGO_WIDTH = 1200
/** colors.onNavy and colors.white in src/theme/tokens.ts. */
const ON_NAVY = [243, 250, 250]
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 }

const { data, info } = await sharp(SOURCE).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels: N } = info
const alpha = (x, y) => data[(y * W + x) * N + 3]
const emptyColumn = (x) => {
  for (let y = 0; y < H; y++) if (alpha(x, y) > 8) return false
  return true
}

// Where the B mark sits: from its first inked column to the clear gap before the lettering.
let markLeft = 0
while (markLeft < W && emptyColumn(markLeft)) markLeft++
let markRight = Math.round(markLeft + W * 0.05)
while (markRight < W && !emptyColumn(markRight)) markRight++
if (markRight >= W * 0.4) throw new Error("Couldn't find where the B mark ends")

// The B's S-shaped waist is see-through in the artwork, so it would take the colour of whatever is
// behind it (dark in the footer, dark browser tabs). Fill it white, as the logo shows it on white. On
// each row where both sides of the waist band are solid, see-through pixels in between go over white;
// the B's top and bottom edges and the notch on its right are left alone.
const markWidth = markRight - markLeft
const [w0, w1] = [markLeft + Math.round(markWidth * 0.28), markLeft + Math.round(markWidth * 0.67)]
for (let y = 0; y < H; y++) {
  if (alpha(w0, y) < 250 || alpha(w1, y) < 250) continue
  for (let x = w0; x <= w1; x++) {
    const i = (y * W + x) * N
    const a = data[i + 3] / 255
    if (a === 1) continue
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[i + c] * a + 255 * (1 - a))
    data[i + 3] = 255
  }
}

const raw = (buffer) => sharp(buffer, { raw: info })

// Logo for light backgrounds.
await raw(data)
  .resize({ width: LOGO_WIDTH })
  .png({ compressionLevel: 9 })
  .toFile(path.join(BRAND, "beslimnow-logo.png"))

// Logo for emails: on white (mail apps in dark mode can't recolour navy text on a see-through logo),
// twice its 220 px display width. emails/build.mjs links it from the live site.
mkdirSync(path.join(BRAND, "email"), { recursive: true })
await raw(data)
  .resize({ width: 440 })
  .flatten({ background: WHITE })
  .png({ compressionLevel: 9 })
  .toFile(path.join(BRAND, "email", "beslimnow-logo.png"))

// Logo for the navy footer: the navy "Be" and "Now" turn white; the teal "Slim" and the B stay.
// Navy is told apart from teal by hue (more blue than green), so teal's soft edges don't turn white.
const white = Buffer.from(data)
for (let y = 0; y < H; y++) {
  for (let x = markRight; x < W; x++) {
    const i = (y * W + x) * N
    if (white[i + 3] > 0 && white[i + 2] > white[i + 1] + 10 && white[i] < 90) {
      white[i] = ON_NAVY[0]
      white[i + 1] = ON_NAVY[1]
      white[i + 2] = ON_NAVY[2]
    }
  }
}
await raw(white)
  .resize({ width: LOGO_WIDTH })
  .png({ compressionLevel: 9 })
  .toFile(path.join(BRAND, "beslimnow-logo-white.png"))

// The B on its own, trimmed tight.
const mark = await raw(data).extract({ left: markLeft, top: 0, width: markWidth, height: H }).png().toBuffer()
const markTrimmed = await sharp(mark).trim({ threshold: 1 }).png().toBuffer()

/** The B centred in a square: `fill` is how much of the square's height it takes. */
const square = async (size, fill, background) => {
  const inner = Math.round(size * fill)
  const pad = size - inner
  const fitted = await sharp(markTrimmed).resize(inner, inner, { fit: "contain", background: CLEAR }).png().toBuffer()
  const placed = await sharp(fitted)
    .extend({
      top: Math.floor(pad / 2),
      bottom: Math.ceil(pad / 2),
      left: Math.floor(pad / 2),
      right: Math.ceil(pad / 2),
      background: CLEAR,
    })
    .png()
    .toBuffer()
  return (background ? sharp(placed).flatten({ background }) : sharp(placed)).png({ compressionLevel: 9 }).toBuffer()
}

// Browser tab: the B alone on a clear background, as large as the square allows.
const icoSizes = [16, 32, 48]
const pngs = await Promise.all(icoSizes.map((size) => square(size, size <= 16 ? 1 : 0.94)))
const header = Buffer.alloc(6 + 16 * icoSizes.length)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(icoSizes.length, 4)
let offset = header.length
icoSizes.forEach((size, n) => {
  const at = 6 + 16 * n
  header.writeUInt8(size, at)
  header.writeUInt8(size, at + 1)
  header.writeUInt16LE(1, at + 4)
  header.writeUInt16LE(32, at + 6)
  header.writeUInt32LE(pngs[n].length, at + 8)
  header.writeUInt32LE(offset, at + 12)
  offset += pngs[n].length
})
writeFileSync(path.join(ROOT, "src/app/favicon.ico"), Buffer.concat([header, ...pngs]))

// Home-screen icons: the B on white, with room for the rounded masks phones put on icons.
writeFileSync(path.join(ROOT, "src/app/apple-icon.png"), await square(180, 0.7, WHITE))
writeFileSync(path.join(BRAND, "icon-192.png"), await square(192, 0.7, WHITE))
writeFileSync(path.join(BRAND, "icon-512.png"), await square(512, 0.7, WHITE))

console.log(`Brand files written (B mark: columns ${markLeft}-${markRight - 1} of ${W}).`)
