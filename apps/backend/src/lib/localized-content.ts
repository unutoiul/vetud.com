import { createHash } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

export const CONTENT_LOCALES = [
  "en-US", "en-GB", "bg", "cs", "da", "de", "el", "es", "et", "fi", "fr",
  "hr", "hu", "is", "it", "lt", "lv", "nb", "nl", "pl", "pt", "ro", "sk", "sl", "sv",
] as const

export type ContentLocale = typeof CONTENT_LOCALES[number]
export type ContentDictionary = Record<string, string>

export function contentLocale(value: unknown): ContentLocale | null {
  if (typeof value !== "string") return null
  const exact = CONTENT_LOCALES.find(locale => locale.toLowerCase() === value.toLowerCase())
  if (exact) return exact
  const language = value.split("-")[0].toLowerCase()
  if (language === "en") return "en-GB"
  return CONTENT_LOCALES.find(locale => locale === language) ?? null
}

/** Independent of locale and line wrapping; the same key is used in the storefront. */
export function contentKey(value: string): string {
  const text = value.replace(/\s+/g, " ").trim()
  let a = 2166136261
  let b = 5381
  for (let index = 0; index < text.length; index++) {
    a = Math.imul(a ^ text.charCodeAt(index), 16777619)
    b = Math.imul(b, 33) ^ text.charCodeAt(index)
  }
  return `s${(a >>> 0).toString(16).padStart(8, "0")}${(b >>> 0).toString(16).padStart(8, "0")}`
}

export function contentSourceHash(sources: ContentDictionary): string {
  return createHash("sha256").update(JSON.stringify(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)))).digest("hex")
}

export type ReviewedContentInput = {
  locale: string
  source_hash: string
  sources: ContentDictionary
  translations: ContentDictionary
  public_keys: string[]
  review: { reviewed: boolean; model: string; reviewed_at: string }
}

/** Fail closed: an incomplete or mismatched import must never replace a reviewed locale. */
export function validateContentBundle(input: ReviewedContentInput) {
  const locale = contentLocale(input.locale)
  if (!locale || locale !== input.locale) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unsupported content locale.")
  if (!input.review?.reviewed || !input.review.model || !Number.isFinite(Date.parse(input.review.reviewed_at))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "An independent review is required before importing translations.")
  }
  const keys = Object.keys(input.sources)
  if (!keys.length || contentSourceHash(input.sources) !== input.source_hash || Object.keys(input.translations).length !== keys.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Translation source hash or coverage does not match.")
  }
  for (const key of keys) {
    const source = input.sources[key]
    const target = input.translations[key]
    if (typeof source !== "string" || contentKey(source) !== key || typeof target !== "string" || !target.trim() || target.includes("\uFFFD")) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid translation: ${key}.`)
    }
    const tokens = (text: string) => JSON.stringify({
      placeholders: [...new Set([...text.matchAll(/\{([A-Za-z_]\w*)\s*[,}]/g)].map(match => match[1]))].sort(),
      links: [...text.matchAll(/\]\(([^)]+)\)/g)].map(match => match[1]).sort(),
      urls: text.match(/https?:\/\/[^\s<>\])]+/g)?.sort() ?? [],
      tags: [...text.matchAll(/<\/?([A-Za-z][\w-]*)(?:\s[^<>]*?)?>/g)].map(match => match[1]).sort(),
      numbers: text.replace(/https?:\/\/\S+|\{[A-Za-z_]\w*\}/g, "").match(/\d+(?:[.,]\d+)*/g)?.sort() ?? [],
      signed: [...text.matchAll(/(?<![\p{L}\p{N}])[-−+]\s*\d+(?:[.,]\d+)*/gu)].map(match => match[0].replaceAll("−", "-").replace(/\s/g, "")).sort(),
      comparisons: [...text.matchAll(/[≤≥±]\s*\d+(?:[.,]\d+)*/g)].map(match => match[0].replace(/\s/g, "")).sort(),
      percentages: text.replace(/https?:\/\/\S+/g, "").match(/%/g)?.length ?? 0,
    })
    if (tokens(source) !== tokens(target)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Protected tokens changed: ${key}.`)
    if (/<(?:slot\d+|highlight)>/.test(source)) {
      const stack: string[] = []
      for (const match of target.matchAll(/<(\/?)(slot\d+|highlight)>/g)) {
        if (!match[1]) stack.push(match[2])
        else if (stack.pop() !== match[2]) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unbalanced inline markup: ${key}.`)
      }
      if (stack.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unclosed inline markup: ${key}.`)
    }
  }
  const publicTranslations: ContentDictionary = Object.create(null)
  for (const key of input.public_keys) {
    if (!Object.prototype.hasOwnProperty.call(input.sources, key)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Unknown public content key: ${key}.`)
    publicTranslations[key] = input.translations[key]
  }
  return {
    locale, source_hash: input.source_hash, sources: input.sources, translations: input.translations,
    public_translations: publicTranslations, entry_count: keys.length, review: input.review,
  }
}
