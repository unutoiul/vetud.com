import { Fragment, type ReactNode } from "react"

export type Values = Record<string, string | number>

/** Fills the {placeholders} in a message: format("Buy now · {price}", { price: "$239" }). */
export function format(template: string, values: Values = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match))
}

/**
 * Like format, and also turns <tag>…</tag> into elements, so a translation can move the bold part
 * around: rich("Sent to <b>{email}</b>.", { email }, { b: (text) => <strong>{text}</strong> }).
 */
export function rich(template: string, values: Values, tags: Record<string, (text: string) => ReactNode>): ReactNode {
  const text = format(template, values)
  const parts: ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(/<(\w+)>(.*?)<\/\1>/g)) {
    const [whole, tag, inner] = match
    parts.push(text.slice(last, match.index))
    parts.push(<Fragment key={match.index}>{tags[tag] ? tags[tag](inner) : inner}</Fragment>)
    last = match.index + whole.length
  }
  parts.push(text.slice(last))
  return <>{parts}</>
}

/**
 * Splits a message at one placeholder, for text that wraps an animated or styled value:
 * around("Lose weight up to {percent}% in days.", "percent") → ["Lose weight up to ", "% in days."].
 */
export function around(template: string, key: string, values: Values = {}): [string, string] {
  const [before = "", after = ""] = template.split(`{${key}}`)
  return [format(before, values), format(after, values)]
}

/** "a, b and c", with the word for "and" from the messages. */
export function list(items: string[], and: string): string {
  if (items.length < 2) return items.join("")
  return `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`
}
