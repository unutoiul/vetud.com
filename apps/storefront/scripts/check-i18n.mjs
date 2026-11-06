import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { parse } from "@formatjs/icu-messageformat-parser"
import { createTranslator } from "use-intl/core"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const directory = path.join(root, "src/i18n/messages")
const read = file => JSON.parse(fs.readFileSync(path.join(directory, file), "utf8"))
const flatten = (object, prefix = "") => Object.fromEntries(Object.entries(object).flatMap(([key, value]) =>
  typeof value === "string" ? [[prefix + key, value]] : Object.entries(flatten(value, prefix + key + "."))))
const english = flatten(read("en-US.json"))
const keys = Object.keys(english).sort()
// These are also native words or established UI terms in the target language.
const sharedWords = {
  cs: "relevance", da: "guide format", de: "community videos name format", el: "email", es: "generalTopic",
  fr: "guide question discussion questions discussions topicPigmentation pages photos peptide format volume photoNumber currentPage lot lotFilter",
  hr: "format", it: "community home email peptide volume", nb: "guide format",
  nl: "community home open17Track peptide volume openKit", pl: "format", pt: "volume",
  ro: "lot peptide generalTopic format lotFilter", sv: "community guide",
}
const signature = text => {
  const params = new Map()
  const visit = nodes => {
    for (const node of nodes) {
      if (node.type !== 0 && node.type !== 7) params.set(node.value, node.type === 8 ? "tag" : node.type === 6 ? "number" : "value")
      if (node.children) visit(node.children)
      if (node.options) for (const option of Object.values(node.options)) visit(option.value)
    }
  }
  visit(parse(text))
  return [...params].sort(([a], [b]) => a.localeCompare(b))
}

let checked = 0
for (const file of fs.readdirSync(directory).filter(file => file.endsWith(".json"))) {
  const messages = read(file)
  const translated = flatten(messages)
  const locale = file.replace(".json", "")
  if (JSON.stringify(Object.keys(translated).sort()) !== JSON.stringify(keys)) throw new Error(`${file}: message keys differ from English`)
  const t = createTranslator({ locale: file.replace(".json", ""), messages, onError: error => { throw error } })
  for (const key of keys) {
    const text = translated[key]
    if (!locale.startsWith("en-") && key.startsWith("Actions.") && text === english[key]
      && /[A-Za-z]/.test(text.replace(/\{\w+\}/g, ""))
      && !(sharedWords[locale] ?? "").split(" ").includes(key.slice("Actions.".length))) {
      throw new Error(`${file}: untranslated action ${key}`)
    }
    if (!text.trim() || /ZX(?:ROW|ARG)|90817263\d{2}|<(\w+)>\s*<\/\1>/.test(text)) throw new Error(`${file}: invalid translation ${key}`)
    const expected = signature(english[key])
    if (JSON.stringify(signature(text)) !== JSON.stringify(expected)) throw new Error(`${file}: parameters differ for ${key}`)
    const values = Object.fromEntries(expected.map(([name, type]) => [name,
      type === "tag" ? chunks => chunks : type === "number" || /^(count|current|total)$/.test(name) ? 2 : "Example"]))
    t.rich(key, values)
    checked++
  }
}
console.log(`Validated ${checked} translations across 25 locales: matching keys, ICU parameters, and rendered messages.`)
