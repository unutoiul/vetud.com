// Runs before every build.
// - Menu text (src/i18n/messages): every language has every English key, with the same ICU arguments.
// - Page text (src/i18n/content): a language that has a content file must translate every string the
//   site uses; a language without one shows the English. Catalog text (products from the Store API)
//   only warns, so a product added in Medusa Admin doesn't stop a deploy: it shows in English until
//   `npm run translate` runs.
// - Records which strings client components need, so whole guides aren't sent with every page.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { parse } from "@formatjs/icu-messageformat-parser"
import { CATALOG_FILE, collectInventory, contentLanguages, ROOT } from "./content-inventory.mjs"

const MESSAGES = join(ROOT, "src", "i18n", "messages")
const CONTENT = join(ROOT, "src", "i18n", "content")
const flatten = (value, prefix = "") => Object.entries(value).flatMap(([key, item]) => (item && typeof item === "object" ? flatten(item, `${prefix}${key}.`) : [[`${prefix}${key}`, item]]))
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"))

/** The arguments and tags of an ICU message. */
function signature(text) {
  const found = new Set()
  const visit = (nodes) => {
    for (const node of nodes) {
      if (node.type !== 0 && node.type !== 7) found.add(`${node.type === 8 ? "tag" : "arg"}:${node.value}`)
      if (node.children) visit(node.children)
      if (node.options) for (const option of Object.values(node.options)) visit(option.value)
    }
  }
  visit(parse(text, { ignoreTag: false }))
  return [...found].sort().join(",")
}

let failed = false
const english = new Map(flatten(readJson(join(MESSAGES, "en-US.json"))))
for (const file of readdirSync(MESSAGES).filter((name) => name.endsWith(".json"))) {
  const messages = new Map(flatten(readJson(join(MESSAGES, file))))
  const problems = []
  for (const [key, source] of english) {
    const text = messages.get(key)
    if (typeof text !== "string" || !text.trim()) { problems.push(`${key}: missing`); continue }
    try {
      if (signature(text) !== signature(source)) problems.push(`${key}: arguments differ from the English`)
    } catch (error) {
      problems.push(`${key}: ${error.message}`)
    }
  }
  for (const key of messages.keys()) if (!english.has(key)) problems.push(`${key}: not in en-US.json`)
  if (problems.length) {
    failed = true
    console.error(`${file}: ${problems.length} menu text problems:\n  ${problems.slice(0, 20).join("\n  ")}`)
  }
}
if (!failed) console.log(`Menu text: all ${english.size} keys present in every language.`)

const inventory = await collectInventory()
const clientKeys = [...inventory].filter(([, entry]) => entry.client).map(([key]) => key).sort()
writeFileSync(join(CONTENT, "client-keys.json"), `${JSON.stringify(clientKeys)}\n`)

// Languages with a page-text file; src/i18n/page-language.ts tags the rest as English ("en-DE").
writeFileSync(join(CONTENT, "languages.json"), `${JSON.stringify(contentLanguages().filter((language) => existsSync(join(CONTENT, `${language}.json`))))}
`)

const isCatalog = (entry) => [...entry.files].every((file) => file.startsWith(CATALOG_FILE))
for (const language of contentLanguages()) {
  const path = join(CONTENT, `${language}.json`)
  if (!existsSync(path)) {
    console.warn(`${language}: no page-text translations yet; pages show English. Run \`npm run translate -- --lang ${language}\`.`)
    continue
  }
  const { translations } = readJson(path)
  const missing = [...inventory].filter(([key]) => !translations[key]?.trim())
  const pageText = missing.filter(([, entry]) => !isCatalog(entry))
  const catalog = missing.length - pageText.length
  if (pageText.length) {
    failed = true
    console.error(`${language}: ${pageText.length} of ${inventory.size} page texts have no translation:`)
    for (const [, entry] of pageText.slice(0, 20)) console.error(`  ${[...entry.files][0]}: ${entry.text.slice(0, 100)}`)
    console.error(`Run \`npm run translate -- --lang ${language}\` (or translate them in src/i18n/content/${language}.json).`)
  } else {
    console.log(`${language}: all page texts translated${catalog ? `; ${catalog} catalog texts still in English (run \`npm run translate\`)` : ""}`)
  }
}
process.exitCode = failed ? 1 : 0
