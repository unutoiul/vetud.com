/**
 * Keeps the page text files in src/i18n/messages in step with us.json, the English source.
 *
 *   npm run i18n:sync    every country in src/config/markets.ts gets a file; a missing file starts
 *                        as a copy of us.json, and keys added to us.json are copied (in English)
 *                        into every other file. Existing text, translated or not, is never touched.
 *                        Keys that no longer exist in us.json are removed.
 *   npm run i18n:check   lists missing files, missing or extra keys, and {placeholders} or <tags>
 *                        that differ from us.json. Exits with 1 if anything is wrong.
 *
 * A translator edits the words only: same keys, same {placeholders}, same <b>…</b> tags, same
 * number of items in a list.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
const DIR = path.join(ROOT, "src", "i18n", "messages")
const SOURCE = "us"

/** The country codes in MARKETS (src/config/markets.ts), lower case, as the files are named. */
function countries() {
  const markets = readFileSync(path.join(ROOT, "src", "config", "markets.ts"), "utf8")
  const block = markets.slice(markets.indexOf("export const MARKETS"), markets.indexOf("} as const"))
  return [...block.matchAll(/^\s+([A-Z]{2}): \{/gm)].map((match) => match[1].toLowerCase())
}

const read = (code) => JSON.parse(readFileSync(path.join(DIR, `${code}.json`), "utf8"))
const write = (code, data) => writeFileSync(path.join(DIR, `${code}.json`), `${JSON.stringify(data, null, 2)}\n`)

/** Word lists whose length may differ per language: the hero headline rises word by word. */
const FREE_LENGTH = new Set(["hero.headlineLineOne", "hero.headlineLineTwo"])

/** The source's shape with the target's text wherever the target has a value of the same kind. */
function merge(source, target, at = "") {
  if (FREE_LENGTH.has(at) && Array.isArray(target) && target.length && target.every((word) => typeof word === "string"))
    return target
  if (Array.isArray(source)) {
    return source.map((item, index) => merge(item, Array.isArray(target) ? target[index] : undefined, `${at}.${index}`))
  }
  if (source && typeof source === "object") {
    const out = {}
    for (const key of Object.keys(source))
      out[key] = merge(
        source[key],
        target && typeof target === "object" ? target[key] : undefined,
        at ? `${at}.${key}` : key,
      )
    return out
  }
  return typeof target === typeof source ? target : source
}

/** Every text in a file, by path ("hero.trust.2"). */
function flatten(value, prefix = "", out = new Map()) {
  if (FREE_LENGTH.has(prefix) && Array.isArray(value)) out.set(prefix, value.join(" "))
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, out)
  } else {
    out.set(prefix, value)
  }
  return out
}

const tokens = (text) =>
  String(text)
    .match(/\{\w+\}|<\/?\w+>/g)
    ?.sort()
    .join(" ") ?? ""

function sync() {
  const source = read(SOURCE)
  for (const code of countries()) {
    if (code === SOURCE) continue
    const file = path.join(DIR, `${code}.json`)
    const before = existsSync(file) ? readFileSync(file, "utf8") : null
    const next = merge(source, before ? JSON.parse(before) : undefined)
    const text = `${JSON.stringify(next, null, 2)}\n`
    if (text !== before) {
      write(code, next)
      console.log(`${code}.json ${before ? "updated" : "created"}`)
    }
  }
  console.log("i18n sync done")
}

function check() {
  const source = flatten(read(SOURCE))
  let problems = 0
  const report = (message) => {
    problems++
    console.log(message)
  }
  for (const code of countries()) {
    if (!existsSync(path.join(DIR, `${code}.json`))) {
      report(`${code}.json is missing (run npm run i18n:sync)`)
      continue
    }
    const target = flatten(read(code))
    for (const [key, text] of source) {
      if (!target.has(key)) report(`${code}.json: missing ${key}`)
      else if (tokens(text) !== tokens(target.get(key)))
        report(`${code}.json: ${key} should use ${tokens(text) || "no placeholders"}`)
    }
    for (const key of target.keys()) if (!source.has(key)) report(`${code}.json: ${key} is not in ${SOURCE}.json`)
  }
  console.log(problems ? `${problems} problem(s)` : `All ${countries().length} message files match ${SOURCE}.json`)
  process.exitCode = problems ? 1 : 0
}

const command = process.argv[2]
if (command === "sync") sync()
else if (command === "check") check()
else {
  console.log("Usage: node scripts/i18n.mjs sync|check")
  process.exitCode = 1
}
