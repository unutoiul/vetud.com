export const REPUTATION_POINTS = {
  helpfulVote: 2,
  bestAnswer: 15,
  publishedLog: 5,
  removedPost: -10,
} as const

/** Ordered from lowest to highest. Contributors can post links without review. */
export const REPUTATION_LEVELS = [
  { id: "member", name: "Member", min: 0 },
  { id: "contributor", name: "Contributor", min: 25 },
  { id: "trusted", name: "Trusted member", min: 100 },
  { id: "lead", name: "Community lead", min: 300 },
] as const

export type ReputationLevel = (typeof REPUTATION_LEVELS)[number]

export function levelFor(reputation: number): ReputationLevel {
  return [...REPUTATION_LEVELS].reverse().find(level => reputation >= level.min) ?? REPUTATION_LEVELS[0]
}

export type ReputationTally = { helpfulVotes: number; bestAnswers: number; publishedLogs: number; removedPosts: number }

/** Reputation is always recounted from these totals, so it can't drift when votes or posts change. */
export function computeReputation(tally: ReputationTally) {
  const points = tally.helpfulVotes * REPUTATION_POINTS.helpfulVote
    + tally.bestAnswers * REPUTATION_POINTS.bestAnswer
    + tally.publishedLogs * REPUTATION_POINTS.publishedLog
    + tally.removedPosts * REPUTATION_POINTS.removedPost
  return Math.max(0, points)
}
