export const REPUTATION_POINTS = {
  helpfulVote: 2,
  bestAnswer: 15,
  removedPost: -10,
  /** Taking part: each published reply and each published question or discussion. */
  reply: 1,
  thread: 2,
} as const

/**
 * Points from posting stop here, so a member can reach Contributor by taking part, while the higher
 * levels need what other members value: helpful votes and best answers.
 */
export const PARTICIPATION_CAP = 40

/** Ordered from lowest to highest. Contributors can post links without review. */
export const REPUTATION_LEVELS = [
  { id: "newcomer", name: "Newcomer", min: 0 },
  { id: "member", name: "Member", min: 10 },
  { id: "contributor", name: "Contributor", min: 25 },
  { id: "trusted", name: "Trusted member", min: 100 },
  { id: "senior", name: "Senior member", min: 200 },
  { id: "lead", name: "Community lead", min: 300 },
] as const

export type ReputationLevel = (typeof REPUTATION_LEVELS)[number]
export type ReputationLevelId = ReputationLevel["id"]

export function levelFor(reputation: number): ReputationLevel {
  return [...REPUTATION_LEVELS].reverse().find(level => reputation >= level.min) ?? REPUTATION_LEVELS[0]
}

/** The level after this one, or null at the top. */
export function nextLevelFor(reputation: number) {
  return REPUTATION_LEVELS.find(level => level.min > reputation) ?? null
}

/** The lowest reputation that may post links without review. */
export const LINK_LEVEL_MIN = REPUTATION_LEVELS.find(level => level.id === "contributor")!.min

export type ReputationTally = {
  helpfulVotes: number
  bestAnswers: number
  removedPosts: number
  replies?: number
  threads?: number
}

/** Capped points for published replies and threads. */
export function participationPoints(tally: Pick<ReputationTally, "replies" | "threads">) {
  return Math.min(PARTICIPATION_CAP, (tally.replies ?? 0) * REPUTATION_POINTS.reply + (tally.threads ?? 0) * REPUTATION_POINTS.thread)
}

/** Reputation is always recounted from these totals, so it can't drift when votes or posts change. */
export function computeReputation(tally: ReputationTally) {
  const points = tally.helpfulVotes * REPUTATION_POINTS.helpfulVote
    + tally.bestAnswers * REPUTATION_POINTS.bestAnswer
    + tally.removedPosts * REPUTATION_POINTS.removedPost
    + participationPoints(tally)
  return Math.max(0, points)
}
