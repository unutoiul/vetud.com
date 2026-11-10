import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"
import test from "node:test"
import ts from "typescript"

const require = createRequire(import.meta.url)
const base = path.resolve("src/lib")
const modules = new Map()
function load(file) {
  if (modules.has(file)) return modules.get(file).exports
  const compiledModule = { exports: {} }
  modules.set(file, compiledModule)
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const localRequire = name => {
    if (name === "./product") return { sortedVariants: p => p.variants ?? [], initialProductVariant: p => p.variants?.[0], isVariantInStock: () => true }
    if (name.startsWith(".")) return load(path.resolve(path.dirname(file), name + ".ts"))
    return require(name)
  }
  new Function("require", "module", "exports", code)(localRequire, compiledModule, compiledModule.exports)
  return compiledModule.exports
}

const policy = load(path.join(base, "product-format-policy.ts"))
const formats = load(path.join(base, "product-formats.ts"))
const images = load(path.join(base, "product-images.ts"))
const variant = (id, format, amount, price) => ({ id, title: `${format} · ${amount}`, calculated_price: price, options: [{ value: format, option: { title: "Format" } }, { value: amount, option: { title: "Amount" } }] })

test("the original Retatrutide catalog formats and prices remain available", () => {
  const price = { calculated_amount: 58, currency_code: "usd" }
  const product = { id: "research", handle: "retatrutide", variants: [variant("restored-box", "Pen kit box", "5 mg"), variant("restored-cartridge", "Dual-chamber vial", "5 mg"), variant("kept", "Vial", "5 mg", price)] }
  const reviewed = policy.reviewedProductFormats(product)
  assert.deepEqual(reviewed.variants.map(v => v.id), ["restored-box", "restored-cartridge", "kept"])
  assert.equal(reviewed.variants[2].calculated_price, price)
  assert.equal(product.variants.length, 3)
  assert.equal(formats.shortAvailability(product), "Pen kit box / Dual-chamber vial / Vial · 5 mg")
  const topical = policy.reviewedProductFormats({ ...product, handle: "decapeptide-12" })
  assert.deepEqual(topical.variants.map(v => v.id), ["kept"])
  assert.equal(formats.shortAvailability({ ...product, handle: "decapeptide-12" }), "Vial · 5 mg")
})

test("nasal and supply variants remain distinct from pen compatibility", () => {
  const product = { handle: "selank", variants: [variant("retired", "Dual-chamber vial", "5 mg"), variant("vial", "Vial", "5 mg"), variant("spray", "Nasal spray", "5 mg")] }
  assert.deepEqual(policy.reviewedProductFormats(product).variants.map(v => v.id), ["retired", "vial", "spray"])
  assert.equal(formats.shortAvailability(product).includes("chamber"), true)
  const supply = { handle: "u-100-syringes", variants: [{ id: "supply", title: "Box of 10" }] }
  assert.equal(policy.reviewedProductFormats(supply).variants[0].id, "supply")
})

test("lab accessories require explicit product scope and never appear for other formats", () => {
  for (const metadata of [null, {}, { preparation_addons_allowed: true }, { injection_format_verified: true }, { preparation_addons_allowed: "true", injection_format_verified: "true" }]) {
    assert.equal(policy.preparationAddOnsAllowed({ metadata }), false)
  }
  const product = { metadata: { preparation_addons_allowed: true, preparation_addons_scope: "optional-laboratory-vial", injection_format_verified: false } }
  assert.equal(policy.preparationAddOnsAllowed(product), true)
  assert.equal(policy.preparationAddOnsAllowed(product, "Vial"), true)
  for (const format of ["Nasal spray", "Pen kit box", "Dual-chamber vial", "Box of 10", ""]) {
    assert.equal(policy.preparationAddOnsAllowed(product, format), false)
  }
  assert.equal(policy.preparationAddOnsAllowed({ metadata: { ...product.metadata, preparation_addons_allowed: false } }, "Vial"), false)
})

test("original galleries are restored while Decapeptide-12 stays vial-only", () => {
  for (const handle of ["decapeptide-12"]) {
    const photos = images.getProductImages({ handle })
    assert.equal(photos.length, 1)
    assert.equal(photos[0].format, "Vial")
    assert.equal(photos[0].url.endsWith("-vial.webp"), true)
  }
  for (const handle of ["retatrutide", "ghk-cu", "bpc-157", "glow-blend"]) {
    assert.equal(images.getProductImages({ handle }).some(i => i.format === "Dual-chamber vial"), true)
    assert.equal(images.getProductImages({ handle }).some(i => i.format === "Pen kit box"), true)
  }
  assert.equal(images.getProductImages({ handle: "selank" }).some(i => i.format === "Nasal spray"), true)
  assert.equal(images.getProductThumbnail("bpc-157", "/historic-order-photo.webp", "Historical kit · 5 mg"), "/historic-order-photo.webp")
})
