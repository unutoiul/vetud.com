// Runs before every build. Fails if a published language is missing any page text, and records which
// strings the browser needs so whole guides are not sent with every page.
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { collectInventory, launchedLanguages, ROOT } from "./content-inventory.mjs"

const CONTENT = join(ROOT, "src", "i18n", "content")
const inventory = await collectInventory()

const clientKeys = [...inventory]
  .filter(([, entry]) => entry.client)
  .map(([key]) => key)
  .sort()
writeFileSync(join(CONTENT, "client-keys.json"), `${JSON.stringify(clientKeys)}\n`)

const flatten = (value, prefix = "") =>
  Object.entries(value).flatMap(([key, item]) =>
    item && typeof item === "object" ? flatten(item, `${prefix}${key}.`) : [[`${prefix}${key}`, item]],
  )
const englishMessages = flatten(JSON.parse(readFileSync(join(ROOT, "src", "i18n", "messages", "en.json"), "utf8")))

let failed = false
for (const language of launchedLanguages().filter((code) => code !== "en")) {
  const messagePath = join(ROOT, "src", "i18n", "messages", `${language}.json`)
  const messages = existsSync(messagePath)
    ? Object.fromEntries(flatten(JSON.parse(readFileSync(messagePath, "utf8"))))
    : {}
  const missingMessages = englishMessages.filter(([key]) => typeof messages[key] !== "string" || !messages[key].trim())
  if (missingMessages.length) {
    failed = true
    console.error(
      `${language}: ${missingMessages.length} menu texts have no translation (${missingMessages
        .slice(0, 5)
        .map(([key]) => key)
        .join(", ")}…). Run \`npm run translate -- --lang ${language}\`.`,
    )
  }

  const path = join(CONTENT, `${language}.json`)
  const translations = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")).translations : {}
  const missing = [...inventory].filter(([key]) => !translations[key]?.trim())
  if (missing.length) {
    failed = true
    console.error(`${language}: ${missing.length} of ${inventory.size} strings have no translation:`)
    for (const [, entry] of missing.slice(0, 40)) console.error(`  ${[...entry.files][0]}: ${entry.text.slice(0, 100)}`)
    console.error(
      `Run \`npm run translate -- --lang ${language}\` (or translate them in src/i18n/content/${language}.json), or remove "${language}" from LANGUAGES in src/i18n/languages.ts.`,
    )
  } else if (!missingMessages.length) {
    console.log(`${language}: all ${englishMessages.length} menu texts and ${inventory.size} page texts translated`)
  }
}
process.exitCode = failed ? 1 : 0
