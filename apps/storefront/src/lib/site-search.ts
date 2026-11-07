/**
 * The header search's index of the learning library and the news, served once from
 * /api/search-index and searched in the browser. Products are searched with Meilisearch.
 */
/** `about` is searched but not shown, so "GLP-1" finds Semaglutide. */
export type GuideEntry = { slug: string; name: string; aka?: string; line: string; category: string; about: string }
/** `date` is ISO so the reader's locale formats it; entries come newest first. */
export type ArticleEntry = { slug: string; title: string; dek: string; kind: string; date: string; peptides: string[] }
export type ProductEntry = { id: string; title: string; handle: string; description: string }
export type SearchIndex = { guides: GuideEntry[]; articles: ArticleEntry[]; products?: ProductEntry[] }

/** The text to search: the name or title, then the closer fields, then the background text. */
export type SearchFields = [main: string, near: string[], far?: string[]]

const SEARCH_LETTERS: Record<string, string> = { ł: "l", ø: "o", æ: "ae", œ: "oe", ð: "d", þ: "th", ß: "ss" }
const normalize = (value: string) => value.toLowerCase().normalize("NFKD").replace(/\p{M}+/gu, "").replace(/[łøæœðþß]/g, letter => SEARCH_LETTERS[letter]).replace(/[^\p{L}\p{N}+]+/gu, " ").trim()

/**
 * Ranks entries whose fields contain every word of the query. Matches in the main field come
 * first, then those starting with the query, then those found without the background text.
 */
export function rank<T>(entries: T[], query: string, fields: (entry: T) => SearchFields, limit: number): T[] {
  const words = normalize(query).split(" ").filter(Boolean)
  if (!words.length) return []
  const scored = entries.flatMap((entry) => {
    const [main, near, far = []] = fields(entry)
    const primary = normalize(main)
    // "bpc157" should find "BPC-157": compare without spaces as well.
    const compact = primary.replace(/ /g, "")
    const close = [primary, ...near.map(normalize)].join(" ")
    const everything = [close, ...far.map(normalize)].join(" ")
    const found = (text: string) => words.every((word) => text.includes(word) || compact.includes(word))
    if (!found(everything)) return []
    const score = (found(primary) ? 4 : 0) + (primary.startsWith(words[0]) || compact.startsWith(words[0]) ? 2 : 0) + (found(close) ? 1 : 0)
    return [{ entry, score }]
  })
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((item) => item.entry)
}

let cached: Promise<SearchIndex> | undefined

/** Loads the index once per visit; a failed load is retried on the next search. */
export function loadSearchIndex(): Promise<SearchIndex> {
  cached ??= fetch("/api/search-index").then((response) => {
    if (!response.ok) throw new Error(`Search index: ${response.status}`)
    return response.json() as Promise<SearchIndex>
  }).catch((error) => {
    cached = undefined
    throw error
  })
  return cached
}
