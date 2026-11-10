import { REPUTATION_LEVELS } from "./reputation"

export type HoldReason = "dose" | "link" | "image" | "reports"

/** Open reports from different members that hide a post until staff review it. */
export const REPORTS_TO_HIDE = 3

// A number followed by a dose unit: "250 mcg", "2.4mg", "10 IU", "0,5 ml", "20 units", "4 clicks".
// Body weight (kg, lb) and waist (cm, in) never match, so members can still mention them.
const DOSE_PATTERN = /(?<![\p{L}\p{N}])\d+(?:[.,]\d+)?\s*(?:mg|mgs|mcg|µg|μg|ug|iu|i\.u\.|units?|ml|cc|clicks?)(?![\p{L}\p{N}])/iu
const LINK_PATTERN = /\bhttps?:\/\/|\bwww\.[a-z0-9-]/i

export function containsDose(text: string) {
  return DOSE_PATTERN.test(text)
}

export function containsLink(text: string) {
  return LINK_PATTERN.test(text)
}

type Author = { role: string; reputation: number }

/** Experts, moderators and members from the Contributor level up. */
export function isTrusted(author: Author) {
  return author.role !== "member" || author.reputation >= REPUTATION_LEVELS[1].min
}

/**
 * Decides whether a new or edited post waits for review. The community never shares doses, so a
 * dose amount holds every post, including experts'. Links and photos are held until a member
 * reaches the Contributor level, which keeps spam (and photos of labels or bodies) out without
 * slowing down regulars.
 */
export function screenPost(texts: (string | null | undefined)[], author: Author, imageCount = 0): HoldReason | null {
  const text = texts.filter(Boolean).join("\n")
  if (containsDose(text)) return "dose"
  if (isTrusted(author)) return null
  if (containsLink(text)) return "link"
  if (imageCount > 0) return "image"
  return null
}
