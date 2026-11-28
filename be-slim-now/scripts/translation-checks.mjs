// Automatic checks for every machine translation before it is saved. A translation that fails is
// sent back once with the problems listed; if it fails again it isn't saved and the English stays.
// `npm run i18n:check` checks the files' shape (keys, list lengths) on top of this.

const sorted = (values) => [...values].sort()

/** Everything that must come through a translation unchanged. */
function protectedTokens(text) {
  return {
    placeholders: sorted([...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1])),
    tags: sorted([...text.matchAll(/<\/?(\w+)>/g)].map((match) => match[0])),
    numbers: sorted(
      text
        .replace(/\{\w+\}/g, "")
        // 1 000, 1.000 and 1,000 are the same number; 99,5 and 99.5 too.
        .replace(/(?<=\d)[\s  ](?=\d{3}(?:\D|$))/g, ",")
        .match(/\d+(?:[.,]\d+)*/g)
        ?.map((number) => number.replace(/[.,](?=\d{3}(?:\D|$))/g, "").replaceAll(",", ".")) ?? [],
    ),
    percentSigns: text.match(/%/g)?.length ?? 0,
  }
}

const DOSE = /\d\s*(?:mg|mcg|µg|μg|ug|iu|ml|units?)(?![\p{L}\p{N}])/giu
const ENGLISH_WORDS = /\b(?:the|and|with|for|what|how|this|that|from|your|are|is|of|to)\b/gi

/** Problems with one translated text, or [] when it can be saved. */
export function checkTranslation(source, target, keepAsWritten = []) {
  if (typeof target !== "string" || !target.trim()) return ["empty translation"]
  const problems = []
  if (target.includes("�")) problems.push("broken characters")
  const a = protectedTokens(source)
  const b = protectedTokens(target)
  for (const field of Object.keys(a)) {
    if (JSON.stringify(a[field]) !== JSON.stringify(b[field])) {
      problems.push(
        `${field} changed: English has ${JSON.stringify(a[field])}, translation has ${JSON.stringify(b[field])}`,
      )
    }
  }
  const stack = []
  for (const match of target.matchAll(/<(\/?)(\w+)>/g)) {
    if (!match[1]) stack.push(match[2])
    else if (stack.pop() !== match[2]) problems.push("tags are not balanced")
  }
  if (stack.length) problems.push("a tag is not closed")
  if ((target.match(DOSE)?.length ?? 0) > (source.match(DOSE)?.length ?? 0)) problems.push("a dose or amount was added")
  for (const term of keepAsWritten) {
    if (source.includes(term) && !target.includes(term)) problems.push(`"${term}" must stay exactly as written`)
  }
  // "Every pen is " runs straight into the next words on the page, so edge spaces matter.
  if (/^\s/.test(source) !== /^\s/.test(target)) problems.push("leading space added or removed")
  if (/\s$/.test(source) !== /\s$/.test(target)) problems.push("trailing space added or removed")
  if (target.length > source.length * 3 + 40) problems.push("much longer than the English")
  return problems
}

/** A longer English sentence returned unchanged: not rejected, but listed in the run's summary. */
export const keptInEnglish = (source, target) =>
  target.trim() === source.trim() && source.split(/\s+/).length >= 6 && (source.match(ENGLISH_WORDS)?.length ?? 0) >= 2
