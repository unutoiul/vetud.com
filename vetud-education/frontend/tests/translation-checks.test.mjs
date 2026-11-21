import assert from "node:assert/strict"
import { test } from "node:test"
import { checkContent, checkMessage, keptInEnglish } from "../scripts/translation-checks.mjs"

test("a faithful translation passes", () => {
  assert.deepEqual(checkContent("In STEP 1, people lost 14.9% of their weight over 68 weeks.", "Dans STEP 1, les participants ont perdu 14,9 % de leur poids en 68 semaines.", ["STEP"]), [])
  assert.deepEqual(checkContent("About 1,000 people took part.", "Environ 1 000 personnes y ont participé."), [])
  assert.deepEqual(checkContent("VIP is a peptide of 28 building blocks.", "VIP est un peptide de 28 unités."), [])
})

test("changed numbers, links, placeholders and markup are rejected", () => {
  assert.match(checkContent("People lost 15% of their weight.", "Les participants ont perdu 51 % de leur poids.").join(), /numbers changed/)
  assert.match(checkContent("Read [the study](https://example.org/a).", "Lisez l’étude.").join(), /links changed/)
  assert.match(checkContent("{v0} | VETUD Learn", "{v1} | Ressources VETUD").join(), /placeholders changed/)
  assert.match(checkContent("See <slot1>the guide</slot1> first.", "Voir <slot1>le guide first.").join(), /markup/)
})

test("an added dose is rejected", () => {
  assert.match(checkContent("The trial tested a weekly injection.", "L’essai a testé une injection hebdomadaire de 2,4 mg.").join(), /dose/)
})

test("protected names must stay as written", () => {
  assert.match(checkContent("Wegovy is sold by Novo Nordisk.", "Le Vegovi est vendu par Novo Nordisk.", ["Wegovy", "Novo Nordisk"]).join(), /Wegovy/)
})

test("ICU plurals may add the target language's categories but keep their arguments", () => {
  const source = "{count, plural, one {# guide} other {# guides}}"
  assert.deepEqual(checkContent(source, "{count, plural, one {# przewodnik} few {# przewodniki} many {# przewodników} other {# przewodnika}}"), [])
  assert.match(checkContent(source, "{total, plural, one {# guide} other {# guides}}").join(), /ICU|placeholders/)
  assert.match(checkMessage("Hello {name}", "Bonjour {name").join(), /ICU syntax/)
  assert.deepEqual(checkMessage("Read <link>more</link>", "Lire <link>la suite</link>"), [])
})

test("English left unchanged is pointed out, not rejected", () => {
  const title = "Open-label evaluation of the skin-brightening efficacy of a new system"
  assert.equal(keptInEnglish(title, title), true)
  assert.deepEqual(checkContent(title, title), [])
})
