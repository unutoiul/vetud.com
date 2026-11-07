import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"
import { test } from "node:test"
import { fileURLToPath } from "node:url"
import ts from "typescript"
import { createTranslator } from "next-intl"
const filename = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/i18n/content.ts")
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const exportsObject = {}
vm.runInNewContext(compiled, { exports: exportsObject, require: name => { if (name === "next-intl") return { createTranslator }; throw new Error(`Unexpected dependency: ${name}`) } }, { filename })
const { contentKey, createContentTranslator } = exportsObject
const ct = createContentTranslator({ [contentKey("A clear description.")]: "Une description claire.", [contentKey("Page {v0} of {v1}")]: "Seite {v0} von {v1}" })

test("translates registered text while preserving surrounding whitespace", () => {
  assert.equal(ct(" A clear description. "), " Une description claire. ")
  assert.equal(ct("A clear\n description."), "Une description claire.")
})
test("preserves identifiers, original customer text, and non-string React values", () => {
  for (const value of ["New customer text", "prod_123", "Vial", "", null, undefined, 24]) assert.equal(ct(value), value)
  const node = { type: "strong", props: { children: "Original text" } }
  assert.equal(ct(node), node)
})
test("substitutes complete sentences in target language order", () => {
  assert.equal(ct.template("Page {v0} of {v1}", { v0: 2, v1: 12 }), "Seite 2 von 12")
  assert.equal(ct.has("A clear description."), true)
  assert.equal(ct.has("Unknown source"), false)
})
test("returns raw text for React to escape without interpreting markup or ICU", () => {
  const raw = "<script>alert(1)</script> {count, plural, one {item} other {items}}"
  const translate = createContentTranslator({ [contentKey(raw)]: raw })
  assert.equal(translate(raw), raw)
})

test("interpolates complete runtime sentences in native order", () => {
  const source = "{v0}: what the research shows"
  const target = "Was die Forschung zu {v0} zeigt"
  const translate = createContentTranslator({ [contentKey(source)]: target }, "de", { [contentKey(source)]: { source, target } })
  assert.equal(translate("NAD+: what the research shows"), "Was die Forschung zu NAD+ zeigt")
  assert.equal(translate("Unrelated source text"), "Unrelated source text")
})

test("uses native plural categories rather than English singular/plural rules", () => {
  const source = "{count, plural, one {# reply} other {# replies}}"
  const translate = createContentTranslator({ [contentKey(source)]: "{count, plural, one {# odpowiedź} few {# odpowiedzi} many {# odpowiedzi} other {# odpowiedzi}}" }, "pl")
  assert.equal(translate.count(1, "reply", "replies"), "1 odpowiedź")
  assert.equal(translate.count(2, "reply", "replies"), "2 odpowiedzi")
  assert.equal(translate.count(5, "reply", "replies"), "5 odpowiedzi")
})

test("renders complete sentences with safe inline elements and empty optional values", () => {
  const source = "Read <slot0>the original study</slot0>{v0}."
  const target = "Lisez <slot0>l’étude originale</slot0>{v0}."
  const translate = createContentTranslator({ [contentKey(source)]: target }, "fr")
  const result = translate.rich(source, { v0: null }, { slot0: children => ({ type: "strong", children }) })
  assert.equal(result[0], "Lisez ")
  assert.equal(result[1].type, "strong")
  assert.equal(result[1].children.join(""), "l’étude originale")
  assert.equal(result.includes("{v0}"), false)
})

test("retains the original if translated inline markup is malformed", () => {
  const source = "Read <slot0>the study</slot0>."
  const translate = createContentTranslator({ [contentKey(source)]: "Lire </slot0>l’étude<slot0>." }, "fr")
  const result = translate.rich(source, {}, { slot0: children => children.join("") })
  assert.equal(result.join(""), "Read the study.")
})

test("search handles Greek, Bulgarian, and European letters without losing compound matching", () => {
  const searchFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/lib/site-search.ts")
  const compiledSearch = ts.transpileModule(fs.readFileSync(searchFile, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const search = {}
  vm.runInNewContext(compiledSearch, { exports: search }, { filename: searchFile })
  for (const [text, query] of [["Έρευνα για πεπτίδια", "ερευνα πεπτιδια"], ["Пептидни изследвания", "изследвания"], ["Białko", "bialko"], ["BPC-157", "bpc157"]]) {
    assert.equal(search.rank([{ text }], query, item => [item.text, []], 5).length, 1)
  }
})
