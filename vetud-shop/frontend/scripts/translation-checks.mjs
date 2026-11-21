// Automatic checks for every machine translation before it is saved. A translation that fails is
// sent back once with the problem; if it still fails it is left out, so the build check reports it.
import { parse, TYPE } from "@formatjs/icu-messageformat-parser"

const sorted = (values) => [...values].sort()

/** Everything that must come through a translation unchanged. */
export function protectedTokens(text) {
  return {
    placeholders: sorted(new Set([...text.matchAll(/\{([A-Za-z_]\w*)\s*[,}]/g)].map((match) => match[1]))),
    links: sorted([...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1])),
    urls: sorted(text.match(/https?:\/\/[^\s<>\])]+/g) ?? []),
    tags: sorted([...text.matchAll(/<\/?([A-Za-z][\w-]*)(?:\s[^<>]*?)?>/g)].map((match) => match[1])),
    numbers: sorted(
      text
        .replace(/https?:\/\/\S+|\{[A-Za-z_]\w*\}/g, "")
        // 1 000 and 1.000 are how many languages write 1,000.
        .replace(/(?<=\d)[   ](?=\d{3}(?:\D|$))/g, ",")
        .match(/\d+(?:[.,]\d+)*/g)
        ?.map((number) => number.replace(/[.,](?=\d{3}(?:\D|$))/g, "").replaceAll(",", ".")) ?? [],
    ),
    percentages: text.replace(/https?:\/\/\S+/g, "").match(/%/g)?.length ?? 0,
  }
}

const DOSE = /\d\s*(?:mg|mcg|µg|μg|ug|iu|ml|units?)(?![\p{L}\p{N}])/giu
const ENGLISH_WORDS = /\b(?:the|and|with|for|what|how|this|that|from|your|are|is|of|to)\b/gi

function sameTokens(source, target) {
  const a = protectedTokens(source)
  const b = protectedTokens(target)
  const problems = []
  for (const field of Object.keys(a)) {
    if (JSON.stringify(a[field]) !== JSON.stringify(b[field])) problems.push(`${field} changed: English has ${JSON.stringify(a[field])}, translation has ${JSON.stringify(b[field])}`)
  }
  return problems
}

function inlineMarkup(target) {
  const stack = []
  for (const match of target.matchAll(/<(\/?)(slot\d+|highlight|link|b|strong|em)>/g)) {
    if (!match[1]) stack.push(match[2])
    else if (stack.pop() !== match[2]) return ["inline markup is not balanced"]
  }
  return stack.length ? ["inline markup is not closed"] : []
}

function common(source, target, keepAsWritten) {
  const problems = []
  if (typeof target !== "string" || !target.trim()) return ["empty translation"]
  if (target.includes("�")) problems.push("broken characters")
  problems.push(...sameTokens(source, target), ...inlineMarkup(target))
  if ((target.match(DOSE)?.length ?? 0) > (source.match(DOSE)?.length ?? 0)) problems.push("a dose or amount was added")
  for (const term of keepAsWritten) {
    if (source.includes(term) && !target.includes(term)) problems.push(`"${term}" must stay exactly as written`)
  }
  if (target.length > source.length * 3 + 40) problems.push("much longer than the English")
  return problems
}

/** Arguments and tags of an ICU message, to compare a translation with its English. */
function icuShape(text) {
  const names = new Set()
  const tags = new Set()
  const walk = (nodes) => {
    for (const node of nodes) {
      if (node.type === TYPE.tag) { tags.add(node.value); walk(node.children) }
      else if ([TYPE.argument, TYPE.number, TYPE.date, TYPE.time].includes(node.type)) names.add(node.value)
      else if (node.type === TYPE.plural || node.type === TYPE.select) {
        names.add(node.value)
        for (const option of Object.values(node.options)) walk(option.value)
      }
    }
  }
  walk(parse(text, { ignoreTag: false }))
  return JSON.stringify({ names: sorted(names), tags: sorted(tags) })
}

function icuProblems(source, target) {
  let shape
  try {
    shape = icuShape(source)
  } catch {
    return [] // The English isn't ICU (plain page text), so there is nothing to compare.
  }
  try {
    return icuShape(target) === shape ? [] : ["ICU arguments or tags differ from the English"]
  } catch (error) {
    return [`ICU syntax error: ${error.message}`]
  }
}

/**
 * Long English prose returned unchanged. Not a rejection, because study titles and citations rightly
 * stay in English; the review pass and the run's summary point these out.
 */
export const keptInEnglish = (source, target) => target.trim() === source.trim() && source.split(/\s+/).length >= 6 && (source.match(ENGLISH_WORDS)?.length ?? 0) >= 2

/** Page text passed through ct(). */
export function checkContent(source, target, keepAsWritten = []) {
  const problems = common(source, target, keepAsWritten)
  if (/\{\w+, (?:plural|select)/.test(source)) problems.push(...icuProblems(source, target))
  return problems
}

/** A next-intl message (ICU syntax). */
export function checkMessage(source, target, keepAsWritten = []) {
  const problems = common(source, target, keepAsWritten).filter((problem) => !problem.startsWith("placeholders changed"))
  problems.push(...icuProblems(source, target))
  return problems
}
