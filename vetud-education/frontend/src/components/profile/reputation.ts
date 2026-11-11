import type { IconName } from "@/components/brand/Icon"
import type { OwnForumProfile, OwnForumStats, ReputationLevel, ReputationRules } from "@/lib/community/types"

/** The rules as the backend sets them (lib/forum/reputation.ts), used until it sends its own. */
export const DEFAULT_RULES: ReputationRules = {
  levels: [
    { id: "newcomer", name: "Newcomer", min: 0 },
    { id: "member", name: "Member", min: 10 },
    { id: "contributor", name: "Contributor", min: 25 },
    { id: "trusted", name: "Trusted member", min: 100 },
    { id: "senior", name: "Senior member", min: 200 },
    { id: "lead", name: "Community lead", min: 300 },
  ],
  points: { helpfulVote: 2, bestAnswer: 15, removedPost: -10, reply: 1, thread: 2 },
  participation_cap: 40,
}

/** What each level unlocks or means, shown on the ladder. */
export const LEVEL_NOTES: Record<ReputationLevel["id"], string> = {
  newcomer: "Welcome. Your first posts are checked before they appear if they contain links or photos.",
  member: "You take part regularly.",
  contributor: "You can share links and photos without review.",
  trusted: "Other members rely on your answers.",
  senior: "One of the community's most helpful voices.",
  lead: "A reference for the whole community.",
}

/** Colors for the level ring and pill, from calm to strong. */
export const LEVEL_COLORS: Record<ReputationLevel["id"], string> = {
  newcomer: "#8a9ab0",
  member: "#3268aa",
  contributor: "#2f7d8c",
  trusted: "#2f7a55",
  senior: "#7a5ac8",
  lead: "#b07a1a",
}

export function currentLevel(rules: ReputationRules, reputation: number) {
  return [...rules.levels].reverse().find((level) => reputation >= level.min) ?? rules.levels[0]
}

export function nextLevel(rules: ReputationRules, reputation: number) {
  return rules.levels.find((level) => level.min > reputation) ?? null
}

/** How far the member is from their level's start to the next level, from 0 to 1. */
export function levelProgress(rules: ReputationRules, reputation: number) {
  const current = currentLevel(rules, reputation)
  const next = nextLevel(rules, reputation)
  if (!next) return 1
  return Math.min(1, Math.max(0, (reputation - current.min) / (next.min - current.min)))
}

export type Achievement = { id: string; icon: IconName; title: string; description: string; earned: boolean }

/** Badges earned from what the member has done. Unknown numbers (an older backend) count as not yet. */
export function achievements(profile: OwnForumProfile, stats: Partial<OwnForumStats> | null): Achievement[] {
  const threads = stats?.threads ?? 0
  const replies = stats?.replies ?? 0
  const level = profile.level_id
  const list: Achievement[] = [
    { id: "joined", icon: "check", title: "Joined the community", description: "Chose a community name and accepted the guidelines.", earned: true },
    { id: "first-thread", icon: "news", title: "First discussion", description: "Started a discussion or asked a question.", earned: threads >= 1 },
    { id: "first-reply", icon: "send", title: "First reply", description: "Replied to another member.", earned: replies >= 1 },
    { id: "helpful", icon: "heart", title: "Helpful", description: "Another member marked a post of yours as helpful.", earned: (stats?.helpful_received ?? 0) >= 1 },
    { id: "solver", icon: "checkCircle", title: "Problem solver", description: "One of your replies was chosen as the best answer.", earned: (stats?.best_answers ?? 0) >= 1 },
    { id: "regular", icon: "clock", title: "Regular", description: "Ten published posts.", earned: threads + replies >= 10 },
    { id: "trusted", icon: "shield", title: "Trusted voice", description: "Reached the Trusted member level.", earned: level === "trusted" || level === "senior" || level === "lead" },
    { id: "founding", icon: "mountain", title: "Founding member", description: "Joined in the community's first months.", earned: new Date(profile.joined_at) < new Date("2027-01-01") },
  ]
  if (profile.role === "expert") list.unshift({ id: "expert", icon: "flask", title: "Verified expert", description: "Credentials checked by the VETUD team.", earned: true })
  return list
}
