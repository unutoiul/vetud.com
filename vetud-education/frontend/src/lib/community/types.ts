/** Shapes returned by the backend's /store/forum routes (see vetud-education/backend/src/lib/forum/public.ts). */

export type ThreadKind = "discussion" | "question"
export type ModerationStatus = "published" | "pending" | "hidden" | "removed"

export type ForumAuthor = {
  handle: string | null
  display_name: string
  role: "member" | "expert" | "moderator"
  credentials: string | null
  level: string
  level_id: LevelId
  reputation: number
}

export type ForumMember = ForumAuthor & { bio: string | null; joined_at: string }
export type OwnForumProfile = ForumMember & { status: "active" | "muted" | "banned" }

/** Reputation levels, lowest first (backend lib/forum/reputation.ts). */
export type LevelId = "newcomer" | "member" | "contributor" | "trusted" | "senior" | "lead"
export type ReputationLevel = { id: LevelId; name: string; min: number }

/** How reputation is earned, returned with the member's own profile. */
export type ReputationRules = {
  levels: ReputationLevel[]
  points: { helpfulVote: number; bestAnswer: number; removedPost: number; reply: number; thread: number }
  participation_cap: number
}

/** The signed-in member's own numbers (GET /store/forum/me). */
export type OwnForumStats = {
  threads: number
  replies: number
  helpful_received: number
  best_answers: number
  pending: number
  participation_points: number
  next_level: ReputationLevel | null
}

export type ForumThread = {
  id: string
  kind: ThreadKind
  title: string
  slug: string
  excerpt: string
  /** A topic id from lib/community/topics.ts. */
  topic: string
  peptide_slug: string | null
  pinned: boolean
  locked: boolean
  accepted_post_id: string | null
  reply_count: number
  helpful_count: number
  last_activity_at: string
  created_at: string
  author: ForumAuthor
  mine: boolean
  status?: ModerationStatus
  hold_reason?: string | null
}

export type ForumImage = { id: string; url: string }

export type ForumPost = {
  id: string
  thread_id: string
  body: string
  is_opening: boolean
  helpful_count: number
  edited_at: string | null
  created_at: string
  author: ForumAuthor
  mine: boolean
  voted: boolean
  images: ForumImage[]
  status?: ModerationStatus
  hold_reason?: string | null
}

export type ForumThreadDetail = {
  thread: ForumThread
  opening: ForumPost
  posts: ForumPost[]
  accepted: ForumPost | null
  count: number
  offset: number
  limit: number
  viewer: { profile: ForumAuthor | null; can_accept: boolean }
}

export type ForumThreadList = { threads: ForumThread[]; count: number; offset: number; limit: number }

export type ForumStats = {
  threads: number
  members: number
  experts: number
  /** Published threads and latest activity per topic id. */
  topics?: Record<string, { threads: number; last_activity_at: string | null }>
}

export type ForumMemberPage = { member: ForumMember; totals: { threads: number; replies: number }; threads: ForumThread[] }

export type ThreadFilters = {
  kind?: ThreadKind
  topic?: string
  peptides?: string[]
  author?: string
  sort?: "latest" | "top" | "unanswered"
  q?: string
  offset?: number
  limit?: number
}
