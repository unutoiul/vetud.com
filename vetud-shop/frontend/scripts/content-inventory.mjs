// Lists every piece of page text the shop passes through ct(): the research library, legal pages,
// product overviews, the wording written in components, and the catalog (product, category and
// collection text from the Medusa Store API). Used by check-translations.mjs, translate.mjs and
// export-translation-review.mjs.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs"
import { register } from "node:module"
import { join, relative, sep } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

register("../tests/helpers/resolve-ts.mjs", import.meta.url)

export const ROOT = fileURLToPath(new URL("..", import.meta.url))
const SRC = join(ROOT, "src")

/** The same key the site computes (contentKey in src/i18n/content.ts). */
export function contentKey(value) {
  const text = value.replace(/\s+/g, " ").trim()
  let a = 2166136261
  let b = 5381
  for (let index = 0; index < text.length; index++) {
    a = Math.imul(a ^ text.charCodeAt(index), 16777619)
    b = Math.imul(b, 33) ^ text.charCodeAt(index)
  }
  return `s${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`
}

const isProse = (text) => /[A-Za-z]/.test(text) && (/\s/.test(text.trim()) || /^[A-Z]/.test(text)) && !/^(https?:|\/|#|mailto:)/.test(text)

/**
 * Which top-level fields client components may show. Everything else in these modules is rendered on
 * the server only, so the browser isn't sent whole guides. Modules not listed are all client text.
 */
const CLIENT_FIELDS = {
  // The homepage carousel (client) shows a profile's name, summary and sources; its research briefs are client text too.
  "content/research/peptides.ts": new Set(["name", "aka", "oneLiner", "sources"]),
  "content/legal.ts": new Set(),
}
/** Styles, URLs and errors written as template strings. */
const NOT_SENTENCES = /solid|rgba|calc\(|translate|rotate|ease|scale\(|gradient|transition|transform|\bpx\b|SameSite|sitemap|store\/|images\/|Search index|failed|\\n/
/** Settings that are addresses and keys, not page text. */
const ADDRESS_EXPORTS = new Set(["MEDUSA_BACKEND_URL", "MEDUSA_PUBLISHABLE_KEY", "EDUCATION_URL", "SHOP_URL", "BASE_URL", "DEFAULT_COUNTRY", "SUPPORTED_COUNTRIES", "PRERENDERED_COUNTRIES", "FALLBACK_COUNTRIES", "PAYMENT_BANK_DETAILS"])
const SKIPPED_FIELDS = new Set(["slug", "id", "url", "src", "href", "date", "art", "icon", "category", "status", "pubchem", "tone", "videos", "handle"])
const MODULES = [
  "content/research/peptides.ts", "content/research/categories.ts", "content/research/emerging-weight-research.ts", "content/legal.ts", "lib/config.ts",
]

function sourceFiles(folder) {
  return readdirSync(folder).flatMap((name) => {
    const path = join(folder, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(name) ? [path] : []
  })
}

/** The string literals inside the call that starts at `open` (the opening parenthesis). */
function literalsInCall(code, open) {
  const found = []
  let depth = 0
  for (let index = open; index < code.length; index++) {
    const char = code[index]
    if (char === "(") depth++
    else if (char === ")" && --depth === 0) break
    else if (char === '"' || char === "'" || char === "`") {
      let end = index + 1
      while (end < code.length && code[end] !== char) end += code[end] === "\\" ? 2 : 1
      const body = code.slice(index + 1, end)
      if (!(char === "`" && body.includes("${"))) found.push(unescape(body))
      index = end
    }
  }
  return found
}

const unescape = (text) => text.replace(/\\(["'`\\])/g, "$1").replace(/\\n/g, "\n")

/** A .env-style file as an object (only to find the Store API address and its public key). */
function readEnv(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim())
    return match ? [[match[1], match[2].replace(/^["']|["']$/g, "")]] : []
  }))
}

/**
 * The catalog's text, read from the Store API. Set CATALOG_BACKEND_URL and CATALOG_PUBLISHABLE_KEY to
 * read another store (production) than the one in .env.local. Returns null when the store can't be read.
 */
export async function catalogTexts() {
  const env = { ...readEnv(join(ROOT, ".env.local")), ...process.env }
  const base = (env.CATALOG_BACKEND_URL || env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/$/, "")
  const key = env.CATALOG_PUBLISHABLE_KEY || env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (!base || !key) return null
  const get = async (path) => {
    const response = await fetch(`${base}${path}`, { headers: { "x-publishable-api-key": key }, signal: AbortSignal.timeout(20_000) })
    if (!response.ok) throw new Error(`${path}: ${response.status}`)
    return response.json()
  }
  const all = async (path, field) => {
    const items = []
    for (let offset = 0; ; offset += 100) {
      const page = await get(`${path}${path.includes("?") ? "&" : "?"}limit=100&offset=${offset}`)
      items.push(...page[field])
      if (items.length >= page.count || !page[field].length) return items
    }
  }
  try {
    const [products, categories, collections] = await Promise.all([
      all("/store/products?fields=title,subtitle,description,*variants,*options,*options.values", "products"),
      all("/store/product-categories?fields=name,description", "product_categories"),
      all("/store/collections?fields=title", "collections"),
    ])
    const texts = []
    const push = (where, ...values) => { for (const text of values) if (typeof text === "string" && text.trim()) texts.push({ where, text }) }
    for (const product of products) {
      push(`${CATALOG_FILE}: product name`, product.title)
      push(`${CATALOG_FILE}: product subtitle`, product.subtitle)
      // Blend pages show the description's first paragraph on its own.
      if (product.description) push(`${CATALOG_FILE}: product description`, product.description, ...product.description.split("\n\n"))
      push(`${CATALOG_FILE}: variant name`, ...(product.variants ?? []).map((variant) => variant.title))
      for (const option of product.options ?? []) push(`${CATALOG_FILE}: product option`, option.title, ...(option.values ?? []).map((value) => value.value))
    }
    for (const category of categories) push(`${CATALOG_FILE}: category`, category.name, category.description)
    push(`${CATALOG_FILE}: collection`, ...collections.map((collection) => collection.title))
    return { source: base, texts }
  } catch (error) {
    console.warn(`Couldn't read the catalog from ${base} (${error.message}); product text is left out.`)
    return null
  }
}

export const CATALOG_FILE = "catalog (Medusa)"

/** Every English string, as Map(key → { text, files, client }). `catalog: false` skips the Store API. */
export async function collectInventory({ catalog = true } = {}) {
  const inventory = new Map()
  const add = (text, file, client) => {
    if (typeof text !== "string" || !text.trim() || !isProse(text)) return
    const key = contentKey(text)
    const entry = inventory.get(key) ?? { text: text.replace(/\s+/g, " ").trim(), files: new Set(), client: false }
    entry.files.add(file)
    entry.client ||= client
    inventory.set(key, entry)
  }

  for (const moduleFile of MODULES) {
    const exports = await import(pathToFileURL(join(SRC, moduleFile)).href)
    const allowed = CLIENT_FIELDS[moduleFile]
    // The field directly under each exported item decides whether its text is sent to the browser.
    const walk = (value, topField) => {
      if (typeof value === "string") return add(value, moduleFile, !allowed || allowed.has(topField))
      if (Array.isArray(value)) return value.forEach((item) => walk(item, topField))
      if (value && typeof value === "object") {
        for (const [field, item] of Object.entries(value)) if (!SKIPPED_FIELDS.has(field)) walk(item, topField ?? field)
      }
    }
    for (const [name, value] of Object.entries(exports)) {
      if (typeof value === "function" || ADDRESS_EXPORTS.has(name)) continue
      // Lists of records (PEPTIDES, LEGAL_DOCUMENTS) start their fields one level down.
      if (Array.isArray(value)) value.forEach((item) => walk(item, undefined))
      else walk(value, undefined)
    }
  }

  // ct.count(n, "result") builds an ICU plural from its words.
  for (const path of sourceFiles(SRC)) {
    const file = relative(SRC, path).split(sep).join("/")
    const code = readFileSync(path, "utf8")
    // Sentences built around a value, like `${name}: what the research shows`. ct() matches them as patterns.
    if (file !== "content/legal.ts" && file !== "i18n/content.ts") {
      for (const match of code.matchAll(/`([^`\n]*\$\{[^`\n]*)`/g)) {
        let index = 0
        const pattern = match[1].replace(/\$\{[^}]*\}/g, () => `{v${index++}}`)
        const words = pattern.replace(/\{v\d+\}/g, " ").trim()
        if (/^[A-Z{]/.test(pattern) && /[a-z]{2,}[ ,:][ a-z]*[a-z]{2,}/.test(words) && !NOT_SENTENCES.test(words)) add(pattern, file, true)
      }
    }
    if (MODULES.includes(file) || file === "i18n/content.ts" || file.startsWith("i18n/")) continue
    for (const match of code.matchAll(/\bct(?:\.(template|rich|icu|count))?\(/g)) {
      const literals = literalsInCall(code, match.index + match[0].length - 1)
      if (match[1] === "count") {
        const pairs = literals.length === 4 ? [[literals[0], literals[2]], [literals[1], literals[3]]] : [[literals[0], literals[1] ?? `${literals[0]}s`]]
        for (const [singular, plural] of pairs) if (singular) add(`{count, plural, one {# ${singular}} other {# ${plural}}}`, file, true)
      } else {
        for (const literal of literals) add(literal, file, true)
      }
    }
    for (const match of code.matchAll(/\b(?:label|title|name|description|summary|heading|eyebrow|blurb|explain|focus|headline|study|evidence|text|question|answer|alt):\s*"((?:[^"\\]|\\.)*)"/g)) {
      if (/^[A-Z]/.test(match[1])) add(unescape(match[1]), file, true)
    }
    for (const match of code.matchAll(/\bexport const [A-Z_]+ = "((?:[^"\\]|\\.)*)"/g)) add(unescape(match[1]), file, true)
    // Sentences kept in local lists and passed to ct() later, such as the FAQ and product overviews.
    if (!file.startsWith("theme/")) {
      for (const match of code.matchAll(/"((?:\d+\.\s+)?[A-Z][^"\\\n{}]*\s[^"\\\n{}]*)"/g)) {
        if (/[a-z]{2}/.test(match[1]) && !/[,;]\s*(sans|serif|mono)/.test(match[1])) add(match[1], file, true)
      }
    }
  }

  if (catalog) {
    const found = await catalogTexts()
    for (const { text, where } of found?.texts ?? []) add(text, where, true)
  }
  return inventory
}

/** Shop languages that need page text: every message file except English. */
export function contentLanguages() {
  return readdirSync(join(SRC, "i18n", "messages"))
    .filter((name) => name.endsWith(".json") && !name.startsWith("en"))
    .map((name) => name.replace(/\.json$/, ""))
    .sort()
}
