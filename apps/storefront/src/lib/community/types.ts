/** Shapes returned by the backend's /store/forum routes (see apps/backend/src/lib/forum/public.ts). */

export type ThreadKind = "discussion" | "question" | "research_log"
export type ModerationStatus = "published" | "pending" | "hidden" | "removed"

export type ForumAuthor = {
  handle: string | null
  display_name: string
  role: "member" | "expert" | "moderator"
  credentials: string | null
  level: string
  level_id: "member" | "contributor" | "trusted" | "lead"
  reputation: number
}

export type ForumMember = ForumAuthor & { bio: string | null; joined_at: string }
export type OwnForumProfile = ForumMember & { status: "active" | "muted" | "banned" }

export type ForumThread = {
  id: string
  kind: ThreadKind
  title: string
  slug: string
  excerpt: string
  peptide_slug: string | null
  other_peptides: string[]
  product_handle: string | null
  lot: string | null
  verified_purchase: boolean
  pinned: boolean
  locked: boolean
  accepted_post_id: string | null
  reply_count: number
  helpful_count: number
  last_activity_at: string
  created_at: string
  unit_system: "metric" | "imperial"
  side_effects: string[]
  author: ForumAuthor
  mine: boolean
  status?: ModerationStatus
  hold_reason?: string | null
}

export type ForumPost = {
  id: string
  thread_id: string
  body: string
  is_opening: boolean
  kind: "post" | "check_in"
  week: number | null
  helpful_count: number
  edited_at: string | null
  created_at: string
  author: ForumAuthor
  mine: boolean
  voted: boolean
  status?: ModerationStatus
  hold_reason?: string | null
}

export type ForumMeasurement = { metric: string; week: number; value: number; post_id: string | null }

export type ForumThreadDetail = {
  thread: ForumThread
  opening: ForumPost
  posts: ForumPost[]
  accepted: ForumPost | null
  measurements: ForumMeasurement[]
  count: number
  offset: number
  limit: number
  viewer: { profile: ForumAuthor | null; can_accept: boolean }
}

export type ForumThreadList = { threads: ForumThread[]; count: number; offset: number; limit: number }

export type MetricInsight = {
  metric: string
  change: "percent" | "points"
  logs: number
  stacked: number
  median: number
  p25: number
  p75: number
  median_weeks: number
  curve: { week: number; logs: number; median: number }[]
}

export type PeptideInsights = { peptide: string; logs: number; min_logs: number; insights: MetricInsight[] }

export type ForumStats = { threads: number; logs: number; members: number; experts: number }

export type ForumMemberPage = { member: ForumMember; totals: { threads: number; logs: number; replies: number }; threads: ForumThread[] }

export type ThreadFilters = {
  kind?: ThreadKind
  peptides?: string[]
  lot?: string
  product?: string
  author?: string
  sort?: "latest" | "top" | "unanswered"
  q?: string
  offset?: number
  limit?: number
}
