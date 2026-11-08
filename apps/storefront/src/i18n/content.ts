import { createTranslator } from "next-intl"
import type { ReactNode } from "react"

export type ContentDictionary = Record<string, string>
export type ContentTemplates = Record<string, { source: string; target: string }>

/** Match source text across line wrapping without translating identifiers or object keys. */
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

/** Raw text, never evaluated as ICU or HTML. Unknown or newly edited content keeps its original. */
export function createContentTranslator(dictionary: ContentDictionary = {}, locale = "en-US", templates: ContentTemplates = {}) {
  type Pattern = { pattern: RegExp; names: string[]; target: string; weight: number }
  let patterns: Pattern[] | undefined
  const interpolate = (value: string): string | undefined => {
    patterns ??= Object.values(templates).flatMap(({ source, target }) => {
      const names = [...source.matchAll(/\{(v\d+)\}/g)].map(match => match[1])
      const literal = source.replace(/\{v\d+\}/g, "")
      if (!names.length || literal.replace(/[^A-Za-z]/g, "").length < 8) return []
      const parts = source.replace(/\s+/g, " ").trim().split(/\{v\d+\}/g)
      const escape = (part: string) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      return [{ pattern: new RegExp(`^${parts.map(escape).join("([\\s\\S]*?)")}$`), names, target, weight: literal.length }]
    }).sort((a, b) => b.weight - a.weight)
    for (const { pattern, names, target } of patterns) {
      const match = value.replace(/\s+/g, " ").trim().match(pattern)
      if (!match) continue
      const values = Object.fromEntries(names.map((name, index) => {
        const captured = match[index + 1]
        return [name, dictionary[contentKey(captured)] ?? captured]
      }))
      return target.replace(/\{(v\d+)\}/g, (whole, name: string) => values[name] ?? whole)
    }
  }
  const text = <T>(value: T): T => {
    if (typeof value !== "string" || !value.trim()) return value
    const translation = dictionary[contentKey(value)] ?? interpolate(value)
    if (typeof translation !== "string" || !translation.trim()) return value
    const leading = value.match(/^\s*/)?.[0] ?? ""
    const trailing = value.match(/\s*$/)?.[0] ?? ""
    return (leading + translation.trim() + trailing) as T
  }
  return Object.assign(text, {
    locale,
    rich(source: string, values: Record<string, ReactNode>, tags: Record<string, (children: ReactNode[]) => ReactNode>) {
      const render = (input: string) => {
        const root: ReactNode[] = []
        const stack: { name: string; nodes: ReactNode[] }[] = [{ name: "", nodes: root }]
        let last = 0
        for (const match of input.matchAll(/<\/?slot\d+>|\{v\d+\}/g)) {
          const current = stack[stack.length - 1]
          current.nodes.push(input.slice(last, match.index))
          const token = match[0]
          if (token.startsWith("{")) current.nodes.push(Object.hasOwn(values, token.slice(1, -1)) ? values[token.slice(1, -1)] : token)
          else if (token.startsWith("</")) {
            const name = token.slice(2, -1)
            if (current.name !== name || !tags[name]) throw new Error("Invalid translated inline markup")
            stack.pop()
            stack[stack.length - 1].nodes.push(tags[name](current.nodes))
          } else {
            const name = token.slice(1, -1)
            if (!tags[name]) throw new Error("Unknown translated inline markup")
            stack.push({ name, nodes: [] })
          }
          last = match.index + token.length
        }
        if (stack.length !== 1) throw new Error("Unclosed translated inline markup")
        root.push(input.slice(last))
        return root
      }
      try { return render(text(source)) } catch { return render(source) }
    },
    icu(source: string, values: Record<string, string | number>) {
      const formatter = createTranslator({ locale, messages: { message: text(source) } })
      return formatter("message", values)
    },
    count(count: number, singular: string, plural = `${singular}s`) {
      const source = `{count, plural, one {# ${singular}} other {# ${plural}}}`
      const formatter = createTranslator({ locale, messages: { message: text(source) } })
      return formatter("message", { count })
    },
    template(source: string, values: Record<string, unknown>, options: { translateValues?: boolean } = {}) {
      return text(source).replace(/\{(v\d+)\}/g, (whole, key: string) => Object.hasOwn(values, key) ? String(options.translateValues === false ? values[key] : text(values[key])) : whole)
    },
    has(source: string) { return Object.hasOwn(dictionary, contentKey(source)) },
  })
}

