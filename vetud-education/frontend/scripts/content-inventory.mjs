// Lists every piece of page text the site passes through ct(): the guides, news and legal pages, plus
// the wording written in components. Used by check-translations.mjs and export-french-review.mjs.
import { readdirSync, readFileSync, statSync } from "node:fs"
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

/** Which long-form fields stay on the server. Everything else may be needed by client components. */
const CLIENT_FIELDS = {
  "content/learn/peptides.ts": new Set(["name", "aka", "oneLiner", "whatItIs"]),
  "content/learn/articles.ts": new Set(["headline", "dek", "kind", "topic"]),
  "content/learn/peptide-articles.ts": new Set(["headline", "dek", "kind", "topic"]),
  "content/legal.ts": new Set(),
}
/** Styles, URLs and errors written as template strings. */
const NOT_SENTENCES = /solid|rgba|calc\(|translate|rotate|ease|scale\(|gradient|transition|transform|\bpx\b|SameSite|sitemap|store\/|images\/|Search index|failed|\\n/
/** Patterns too short for the sentence rule above to recognise. */
const SHORT_PATTERNS = ["{v0} | VETUD Learn", "Evidence: {v0}", "Read and watch: {v0}", "All {v0} guides", "about {v0}", "Placebo, {v0}"]
/** Settings that are addresses and keys, not page text. */
const ADDRESS_EXPORTS = new Set(["SHOP_NAME", "SHOP_URL", "BASE_URL", "MEDUSA_BACKEND_URL", "MEDUSA_PUBLISHABLE_KEY"])
const SKIPPED_FIELDS = new Set(["slug", "id", "url", "src", "href", "date", "art", "icon", "peptides", "category", "status", "pubchem", "tone"])
const MODULES = [
  "content/learn/peptides.ts", "content/learn/articles.ts", "content/learn/peptide-articles.ts", "content/learn/categories.ts",
  "content/learn/videos.ts", "content/learn/video-resources.ts", "content/learn/illustrations.ts", "content/learn/editorial-covers.ts",
  "content/learn/emerging-weight-research.ts", "content/learn/weight-loss-trials.ts", "content/learn/search-titles.ts", "content/legal.ts",
  "lib/community/topics.ts", "lib/community/format.ts", "lib/config.ts",
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

export async function collectInventory() {
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
    const walk = (value, topField) => {
      if (typeof value === "string") return add(value, moduleFile, !allowed || allowed.has(topField))
      if (Array.isArray(value)) return value.forEach((item) => walk(item, topField))
      if (value && typeof value === "object") {
        for (const [field, item] of Object.entries(value)) {
          if (SKIPPED_FIELDS.has(field)) continue
          // Headlines are stored in parts for styling and translated whole.
          if (field === "headline" && Array.isArray(item)) add(item.join(""), moduleFile, true)
          walk(item, allowed?.has(topField) || topField === undefined ? field : topField)
        }
      }
    }
    for (const [name, value] of Object.entries(exports)) if (typeof value !== "function" && !ADDRESS_EXPORTS.has(name)) walk(value, undefined)
  }

  for (const pattern of SHORT_PATTERNS) add(pattern, "i18n/content.ts", true)
  // The community page counts threads by kind, with the noun chosen at run time.
  for (const noun of ["question", "discussion"]) add(`{count, plural, one {# ${noun}} other {# ${noun}s}}`, "app/[lang]/community/page.tsx", true)

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
    if (file.startsWith("content/") || file === "i18n/content.ts") continue
    for (const match of code.matchAll(/\bct(?:\.(template|rich|icu|count))?\(/g)) {
      const literals = literalsInCall(code, match.index + match[0].length - 1)
      if (match[1] === "count") {
        // ct.count(n, "reply", "replies"), or two of each when the noun is chosen at run time.
        const pairs = literals.length === 4 ? [[literals[0], literals[2]], [literals[1], literals[3]]] : [[literals[0], literals[1] ?? `${literals[0]}s`]]
        for (const [singular, plural] of pairs) if (singular) add(`{count, plural, one {# ${singular}} other {# ${plural}}}`, file, true)
      } else {
        for (const literal of literals) add(literal, file, true)
      }
    }
    for (const match of code.matchAll(/\b(?:label|title|name|description|summary|heading|eyebrow|blurb|explain):\s*"((?:[^"\\]|\\.)*)"/g)) {
      if (/^[A-Z]/.test(match[1])) add(unescape(match[1]), file, true)
    }
    for (const match of code.matchAll(/\bexport const [A-Z_]+ = "((?:[^"\\]|\\.)*)"/g)) add(unescape(match[1]), file, true)
    // Sentences kept in local lists and passed to ct() later, such as the community guidelines.
    if (!file.startsWith("theme/") && !file.startsWith("i18n/")) {
      for (const match of code.matchAll(/"((?:\d+\.\s+)?[A-Z][^"\\\n{}]*\s[^"\\\n{}]*)"/g)) {
        if (/[a-z]{2}/.test(match[1]) && !/[,;]\s*(sans|serif|mono)/.test(match[1])) add(match[1], file, true)
      }
    }
  }
  return inventory
}

/** The languages the site is published in, read from src/i18n/languages.ts. */
export function launchedLanguages() {
  const source = readFileSync(join(SRC, "i18n", "languages.ts"), "utf8")
  const list = /export const LANGUAGES = \[([^\]]*)\]/.exec(source)?.[1] ?? ""
  return [...list.matchAll(/"([a-z]{2})"/g)].map((match) => match[1])
}
