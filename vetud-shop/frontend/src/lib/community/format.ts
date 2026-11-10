import type { ForumThread, ThreadKind } from "./types"

// Same pattern the backend holds posts for (vetud-shop/backend/src/lib/forum/moderation.ts), so the
// composer can warn before a post is sent for review.
const DOSE_PATTERN = /(?<![\p{L}\p{N}])\d+(?:[.,]\d+)?\s*(?:mg|mgs|mcg|µg|μg|ug|iu|i\.u\.|units?|ml|cc|clicks?)(?![\p{L}\p{N}])/iu

/** The first dose-like phrase in the text ("250 mcg"), if any. */
export function findDose(text: string) {
  return text.match(DOSE_PATTERN)?.[0]?.trim() ?? null
}

/** Questions first, then discussions, wherever the kinds are listed. */
export const THREAD_KINDS: ThreadKind[] = ["question", "discussion"]

export const KIND_LABELS: Record<ThreadKind, string> = {
  question: "Question",
  discussion: "Discussion",
}

export const KIND_PLURALS: Record<ThreadKind, string> = {
  question: "Questions",
  discussion: "Discussions",
}

export const HOLD_MESSAGES: Record<string, string> = {
  dose: "It mentions a dose amount, so a moderator will review it before it appears. The community doesn't share doses; you can edit the post to remove it.",
  link: "New members' links are checked by a moderator first. Links are published straight away once you reach the Contributor level.",
  image: "New members' photos are checked by a moderator first. Photos are published straight away once you reach the Contributor level.",
  reports: "Several members reported it, so it's hidden until a moderator reviews it.",
  staff: "A moderator has hidden it.",
}

/** The short version of /community/guidelines, shown when joining and posting. */
export const GUIDELINE_SUMMARY = [
  "Never share doses, dosing schedules or sources outside Vetud.",
  "Share observations, not medical advice. Encourage others to talk to a doctor.",
  "Be accurate: cite your sources and say when something is a guess.",
  "Your community name, posts and photos are public.",
]

export const REPORT_REASONS = [
  { value: "dose", label: "It shares a dose or protocol" },
  { value: "medical_claim", label: "Medical advice or a health claim" },
  { value: "spam", label: "Spam or advertising" },
  { value: "abuse", label: "Abusive or personal" },
  { value: "other", label: "Something else" },
] as const

export function threadHref(thread: Pick<ForumThread, "id">) {
  return `/community/${thread.id}`
}

export function formatForumDate(date: string, locale = "en-US") {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(date))
}

/** "3 minutes ago", "2 days ago", or a date after a month. */
export function formatRelative(date: string, now = Date.now()) {
  const seconds = Math.round((now - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const units: [number, Intl.RelativeTimeFormatUnit][] = [[60, "minute"], [24, "hour"], [30, "day"]]
  let value = seconds / 60
  for (const [size, unit] of units) {
    if (value < size) return new Intl.RelativeTimeFormat("en-US", { numeric: "auto" }).format(-Math.floor(value), unit)
    value /= size
  }
  return formatForumDate(date)
}

export const plural = (count: number, word: string, many = `${word}s`) => `${count.toLocaleString("en-US")} ${count === 1 ? word : many}`
