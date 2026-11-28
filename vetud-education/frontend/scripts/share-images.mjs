// Makes a 1200×630 JPEG share copy of every guide and news image (public/images/share/<name>.jpg).
// Facebook's link previews document JPEG, PNG and GIF only, and our artwork is .webp, so pages
// point og:image at these copies (shareImage in src/lib/article-seo.ts). Runs before every build;
// existing copies newer than their source are skipped.
import { readFileSync, existsSync, mkdirSync, statSync } from "node:fs"
import { basename, join } from "node:path"
import sharp from "sharp"

const root = join(import.meta.dirname, "..")
const sources = ["src/content/learn/illustrations.ts", "src/content/learn/editorial-covers.ts"]
const images = new Set(
  sources.flatMap((file) =>
    [...readFileSync(join(root, file), "utf8").matchAll(/"?src"?:\s*"(\/images\/[^"]+\.webp)"/g)].map(
      (match) => match[1],
    ),
  ),
)

const outDir = join(root, "public/images/share")
mkdirSync(outDir, { recursive: true })
let made = 0
for (const src of images) {
  const input = join(root, "public", src)
  const output = join(outDir, `${basename(src, ".webp")}.jpg`)
  if (!existsSync(input)) throw new Error(`Share image source missing: ${src}`)
  if (existsSync(output) && statSync(output).mtimeMs >= statSync(input).mtimeMs) continue
  // Scale to 1200 wide, then crop to 630 high keeping most of the top: the artwork's title sits there.
  const scaled = await sharp(input)
    .resize({ width: 1200 })
    .flatten({ background: "#ffffff" })
    .toBuffer({ resolveWithObject: true })
  const extra = Math.max(0, scaled.info.height - 630)
  await sharp(scaled.data)
    .extract({ left: 0, top: Math.round(extra * 0.15), width: 1200, height: Math.min(630, scaled.info.height) })
    .resize(1200, 630, { fit: "cover" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(output)
  made++
}
console.log(`Share images: ${made} made, ${images.size - made} up to date.`)
