const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const vm = require("node:vm")
const { test } = require("node:test")
const ts = require("typescript")

const filename = path.join(__dirname, "../src/lib/localized-content.ts")
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText
const exportsObject = {}
class TestMedusaError extends Error { static Types = { INVALID_DATA: "invalid_data" }; constructor(type, message) { super(message); this.type = type } }
vm.runInNewContext(compiled, { exports: exportsObject, require: name => name === "@medusajs/framework/utils" ? { MedusaError: TestMedusaError } : require(name) }, { filename })
const { contentKey, contentLocale, contentSourceHash, validateContentBundle } = exportsObject
const publicSource = "A 24-week trial: [source](https://example.com/study-2), {v0}."
const privateSource = "Unpublished research product"
const publicKey = contentKey(publicSource)
const privateKey = contentKey(privateSource)
const input = () => {
  const sources = { [publicKey]: publicSource, [privateKey]: privateSource }
  return { locale: "fr", sources, source_hash: contentSourceHash(sources), translations: { [publicKey]: "Un essai de 24 semaines : [source](https://example.com/study-2), {v0}.", [privateKey]: "Produit de recherche non publié" }, public_keys: [publicKey], review: { reviewed: true, model: "test-fixture", reviewed_at: "2026-11-08T00:00:00Z" } }
}

test("regional locales map to available dictionaries", () => {
  assert.equal(contentLocale("de-AT"), "de")
  assert.equal(contentLocale("en-CA"), "en-GB")
  assert.equal(contentLocale("en-US"), "en-US")
  assert.equal(contentLocale(["fr"]), null)
  assert.equal(contentLocale("unknown"), null)
})

test("wrapping and spacing do not change source identity", () => {
  assert.equal(contentKey("A sentence.\n\nNext line."), contentKey(" A sentence. Next line. "))
  assert.notEqual(contentKey("A sentence."), contentKey("A different sentence."))
})

test("complete reviewed bundles retain private content without exposing it", () => {
  const bundle = validateContentBundle(input())
  assert.equal(bundle.entry_count, 2)
  assert.equal(bundle.translations[privateKey], "Produit de recherche non publié")
  assert.equal(Object.keys(bundle.public_translations).length, 1)
  assert.equal(bundle.public_translations[privateKey], undefined)
})

for (const [name, mutate] of [
  ["missing translation", data => { delete data.translations[publicKey] }],
  ["extra translation", data => { data.translations.extra = "unexpected" }],
  ["unreviewed output", data => { data.review.reviewed = false }],
  ["wrong source hash", data => { data.source_hash = "0".repeat(64) }],
  ["changed source", data => { data.sources[publicKey] = "Edited content"; data.source_hash = contentSourceHash(data.sources) }],
  ["changed number", data => { data.translations[publicKey] = data.translations[publicKey].replace("24", "48") }],
  ["changed link", data => { data.translations[publicKey] = data.translations[publicKey].replace("study-2", "study-3") }],
  ["lost placeholder", data => { data.translations[publicKey] = data.translations[publicKey].replace("{v0}", "") }],
  ["unknown public key", data => { data.public_keys.push("missing") }],
  ["empty output", data => { data.translations[publicKey] = " " }],
  ["replacement character", data => { data.translations[publicKey] += "\uFFFD" }],
  ["unsupported locale", data => { data.locale = "xx" }],
]) test(`rejects ${name} before mutation`, () => {
  const data = input()
  mutate(data)
  assert.throws(() => validateContentBundle(data), TestMedusaError)
})

test("plain URLs cannot change", () => {
  const data = input()
  data.sources[publicKey] = publicSource.replace("[source](https://example.com/study-2)", "https://example.com/study-2")
  const actualKey = contentKey(data.sources[publicKey])
  data.sources[actualKey] = data.sources[publicKey]; delete data.sources[publicKey]
  data.translations[actualKey] = "Un essai de 24 semaines : https://example.com/other-2, {v0}."; delete data.translations[publicKey]
  data.public_keys = [actualKey]; data.source_hash = contentSourceHash(data.sources)
  assert.throws(() => validateContentBundle(data), TestMedusaError)
})

test("rejects a reversed comparison, dropped minus sign, or missing percentage", () => {
  const original = "Stored at −20°C; measured ≥25%."
  for (const translated of ["Conservé à 20°C ; valeur ≥25%.", "Conservé à −20°C ; valeur ≤25%.", "Conservé à −20°C ; valeur ≥25."]) {
    const sources = { [contentKey(original)]: original }
    assert.throws(() => validateContentBundle({ ...input(), sources, source_hash: contentSourceHash(sources), translations: { [contentKey(original)]: translated }, public_keys: Object.keys(sources) }), TestMedusaError)
  }
})
