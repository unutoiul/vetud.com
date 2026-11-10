// Writes a spreadsheet for the person checking a translation:
//   node --no-warnings scripts/export-translation-review.mjs fr ../translation-review-fr.csv
import { readFileSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { collectInventory, ROOT } from "./content-inventory.mjs"

const [language = "fr", output = `translation-review-${language}.csv`] = process.argv.slice(2)
const { translations } = JSON.parse(readFileSync(join(ROOT, "src", "i18n", "content", `${language}.json`), "utf8"))
const inventory = await collectInventory()

const cell = (value) => `"${String(value).replace(/"/g, '""')}"`
const rows = [...inventory.values()].sort((a, b) => [...a.files][0].localeCompare([...b.files][0]))
const lines = [[ "Where", "English", language.toUpperCase(), "Reviewer notes" ].map(cell).join(",")]
for (const [key, entry] of [...inventory].sort(([, a], [, b]) => [...a.files][0].localeCompare([...b.files][0]))) {
  lines.push([[...entry.files][0], entry.text, translations[key] ?? "", ""].map(cell).join(","))
}
// A byte-order mark lets Excel read the accents correctly.
writeFileSync(resolve(output), `﻿${lines.join("\r\n")}\r\n`)
console.log(`${rows.length} rows written to ${resolve(output)}`)
