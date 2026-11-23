/**
 * Checks the translated page text and copies it to every country that shares a language.
 *
 *   npm run i18n:translations -- de fr     check de.json and fr.json against us.json, then copy them
 *                                          to their other countries (at, li, ch… / lu, mc) and record
 *                                          which English they were translated from
 *   npm run i18n:translations -- --check   only check every translated language, change nothing
 *   npm run i18n:translations -- --stale   list the English texts that changed since each language
 *                                          was translated (what needs translating again)
 *   … -- --from <folder> de fr             first take de.json / fr.json from that folder (named by
 *                                          language, not country) and put them in place
 *
 * The translations themselves are written by hand (or by Claude) into the first country file of each
 * language below. Same keys, same {placeholders}, same <b> tags and list lengths as us.json; only the
 * headline word lists (hero.headlineLineOne / headlineLineTwo) may have a different number of words.
 */
import { createHash } from "node:crypto"
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { checkTranslation, keptInEnglish } from "./translation-checks.mjs"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const DIR = path.join(ROOT, "src", "i18n", "messages")
const RECORD = path.join(ROOT, "src", "i18n", "translations.json")
const GLOSSARY = JSON.parse(readFileSync(path.join(ROOT, "scripts", "translation-glossary.json"), "utf8"))

/**
 * Each language and the countries that use it, from each country's locale in src/config/markets.ts.
 * The first country's file holds the translation; the others get a copy. Switzerland gets the German
 * text with "ss" for "ß", as the Swiss write it.
 */
export const LANGUAGES = {
  de: { name: "German", countries: ["de", "at", "li"], swiss: ["ch"] },
  fr: { name: "French", countries: ["fr", "lu", "mc"] },
  it: { name: "Italian", countries: ["it", "sm", "va"] },
  es: { name: "Spanish (Spain)", countries: ["es"] },
  ca: { name: "Catalan", countries: ["ad"] },
  pt: { name: "European Portuguese", countries: ["pt"] },
  nl: { name: "Dutch", countries: ["nl", "be"] },
  "en-GB": { name: "British English", countries: ["gb", "ie", "mt"] },
  pl: { name: "Polish", countries: ["pl"] },
  cs: { name: "Czech", countries: ["cz"] },
  sk: { name: "Slovak", countries: ["sk"] },
  hu: { name: "Hungarian", countries: ["hu"] },
  ro: { name: "Romanian", countries: ["ro", "md"] },
  el: { name: "Greek", countries: ["gr", "cy"] },
  bg: { name: "Bulgarian", countries: ["bg"] },
  hr: { name: "Croatian", countries: ["hr"] },
  sl: { name: "Slovenian", countries: ["si"] },
  "sr-Cyrl": { name: "Serbian (Cyrillic)", countries: ["rs"] },
  "sr-Latn-ME": { name: "Montenegrin (Latin)", countries: ["me"] },
  bs: { name: "Bosnian", countries: ["ba"] },
  mk: { name: "Macedonian", countries: ["mk"] },
  sq: { name: "Albanian", countries: ["al", "xk"] },
  lt: { name: "Lithuanian", countries: ["lt"] },
  lv: { name: "Latvian", countries: ["lv"] },
  et: { name: "Estonian", countries: ["ee"] },
  fi: { name: "Finnish", countries: ["fi"] },
  sv: { name: "Swedish", countries: ["se"] },
  da: { name: "Danish", countries: ["dk"] },
  nb: { name: "Norwegian Bokmål", countries: ["no"] },
  is: { name: "Icelandic", countries: ["is"] },
  uk: { name: "Ukrainian", countries: ["ua"] },
  be: { name: "Belarusian", countries: ["by"] },
}

/** Kept in English everywhere: a weight-loss claim that isn't translated into other languages. */
const KEEP_ENGLISH = new Set(["hero.weightLoss"])
/** Word lists whose length may differ per language (the hero headline rises word by word). */
const FREE_LENGTH = new Set(["hero.headlineLineOne", "hero.headlineLineTwo"])

const read = (code) => JSON.parse(readFileSync(path.join(DIR, `${code}.json`), "utf8"))
const write = (code, data) => writeFileSync(path.join(DIR, `${code}.json`), `${JSON.stringify(data, null, 2)}\n`)
const hash = (text) => createHash("sha1").update(text).digest("hex").slice(0, 12)

/** Every text in a file by path ("hero.trust.2"); a free-length word list counts as one text. */
function texts(value, prefix = "", out = new Map()) {
  if (FREE_LENGTH.has(prefix)) out.set(prefix, value.join(" "))
  else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) texts(child, prefix ? `${prefix}.${key}` : key, out)
  else out.set(prefix, value)
  return out
}

/** Same shape as the English: same keys, same list lengths (except the headline word lists). */
function shapeProblems(english, target, prefix = "") {
  if (FREE_LENGTH.has(prefix)) return Array.isArray(target) && target.length ? [] : [`${prefix}: must be a list of words`]
  if (Array.isArray(english)) {
    if (!Array.isArray(target) || target.length !== english.length) return [`${prefix}: must be a list of ${english.length}`]
    return english.flatMap((item, index) => shapeProblems(item, target[index], `${prefix}.${index}`))
  }
  if (english && typeof english === "object") {
    if (!target || typeof target !== "object") return [`${prefix}: missing`]
    const extra = Object.keys(target).filter((key) => !(key in english)).map((key) => `${prefix}.${key}: not in us.json`)
    return [...extra, ...Object.keys(english).flatMap((key) => shapeProblems(english[key], target[key], prefix ? `${prefix}.${key}` : key))]
  }
  return typeof target === "string" ? [] : [`${prefix}: missing`]
}

/** Problems in one language's translation, compared with us.json. */
function check(language) {
  const english = read("us")
  const translated = read(LANGUAGES[language].countries[0])
  const problems = shapeProblems(english, translated)
  if (problems.length) return { problems, english: [] }
  const source = texts(english)
  const target = texts(translated)
  const left = []
  for (const [key, text] of source) {
    const translation = target.get(key)
    if (KEEP_ENGLISH.has(key)) {
      if (translation !== text) problems.push(`${key}: stays as in us.json`)
      continue
    }
    problems.push(...checkTranslation(text, translation, GLOSSARY.keepAsWritten).map((problem) => `${key}: ${problem}`))
    if (language !== "en-GB" && keptInEnglish(text, translation)) left.push(key)
  }
  return { problems, english: left }
}

/** Writes the language's text to all its countries and records the English it was made from. */
function spread(language) {
  const { countries, swiss = [] } = LANGUAGES[language]
  const translated = read(countries[0])
  for (const country of countries) write(country, translated)
  for (const country of swiss) write(country, JSON.parse(JSON.stringify(translated).replaceAll("ß", "ss")))
  const record = existsSync(RECORD) ? JSON.parse(readFileSync(RECORD, "utf8")) : {}
  record[language] = Object.fromEntries([...texts(read("us"))].filter(([key]) => !KEEP_ENGLISH.has(key)).map(([key, text]) => [key, hash(text)]))
  writeFileSync(RECORD, `${JSON.stringify(record, null, 2)}\n`)
}

const args = process.argv.slice(2)
const record = existsSync(RECORD) ? JSON.parse(readFileSync(RECORD, "utf8")) : {}

if (args.includes("--stale")) {
  const english = texts(read("us"))
  for (const language of Object.keys(LANGUAGES)) {
    const made = record[language]
    if (!made) { console.log(`${language}: not translated yet`); continue }
    const stale = [...english].filter(([key, text]) => !KEEP_ENGLISH.has(key) && made[key] !== hash(text)).map(([key]) => key)
    if (stale.length) console.log(`${language}: ${stale.join(", ")}`)
  }
  process.exit(0)
}

const onlyCheck = args.includes("--check")
const fromIndex = args.indexOf("--from")
const from = fromIndex >= 0 ? args[fromIndex + 1] : undefined
const languages = onlyCheck ? Object.keys(record) : args.filter((arg, index) => !arg.startsWith("--") && !(fromIndex >= 0 && index === fromIndex + 1))
for (const language of languages) if (!LANGUAGES[language]) throw new Error(`Unknown language "${language}". Known: ${Object.keys(LANGUAGES).join(", ")}`)
if (!languages.length) {
  console.log("Name the languages to check and copy, e.g. npm run i18n:translations -- de fr")
  process.exit(0)
}

let failed = false
for (const language of languages) {
  const staged = from && path.join(from, `${language}.json`)
  if (staged && existsSync(staged)) write(LANGUAGES[language].countries[0], JSON.parse(readFileSync(staged, "utf8")))
  const { problems, english } = check(language)
  if (problems.length) {
    failed = true
    console.log(`${language}: ${problems.length} problem(s)`)
    for (const problem of problems) console.log(`  ${problem}`)
    continue
  }
  if (!onlyCheck) spread(language)
  const note = english.length ? ` (left in English: ${english.join(", ")})` : ""
  console.log(`${language}: ok${onlyCheck ? "" : `, written to ${[...LANGUAGES[language].countries, ...(LANGUAGES[language].swiss ?? [])].join(", ")}`}${note}`)
}
if (failed) process.exitCode = 1
