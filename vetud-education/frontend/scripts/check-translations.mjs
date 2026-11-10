// Runs before every build. Fails if a published language is missing any page text, and records which
// strings the browser needs so whole guides are not sent with every page.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { collectInventory, launchedLanguages, ROOT } from "./content-inventory.mjs"

const CONTENT = join(ROOT, "src", "i18n", "content")
const inventory = await collectInventory()

const clientKeys = [...inventory].filter(([, entry]) => entry.client).map(([key]) => key).sort()
writeFileSync(join(CONTENT, "client-keys.json"), `${JSON.stringify(clientKeys)}\n`)

let failed = false
for (const language of launchedLanguages().filter((code) => code !== "en")) {
  const path = join(CONTENT, `${language}.json`)
  const translations = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")).translations : {}
  const missing = [...inventory].filter(([key]) => !translations[key]?.trim())
  if (missing.length) {
    failed = true
    console.error(`${language}: ${missing.length} of ${inventory.size} strings have no translation:`)
    for (const [, entry] of missing.slice(0, 40)) console.error(`  ${[...entry.files][0]}: ${entry.text.slice(0, 100)}`)
    console.error(`Translate them in src/i18n/content/${language}.json, or remove "${language}" from src/i18n/languages.ts.`)
  } else {
    console.log(`${language}: all ${inventory.size} strings translated`)
  }
}
process.exitCode = failed ? 1 : 0
