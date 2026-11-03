import { levelFor } from "./reputation"

type Timestamp = Date | string

export type ProfileRecord = {
  id: string
  customer_id: string
  display_name: string
  handle: string
  role: "member" | "expert" | "moderator"
  credentials?: string | null
  bio?: string | null
  reputation: number
  status: "active" | "muted" | "banned"
  created_at: Timestamp
}

export type ThreadRecord = {
  id: string
  author_id: string
  kind: "discussion" | "question" | "research_log"
  title: string
  slug: string
  excerpt: string
  peptide_slug?: string | null
  other_peptides?: unknown
  product_handle?: string | null
  lot?: string | null
  verified_purchase: boolean
  status: "published" | "pending" | "hidden" | "removed"
  hold_reason?: string | null
  pinned: boolean
  locked: boolean
  accepted_post_id?: string | null
  reply_count: number
  helpful_count: number
  last_activity_at: Timestamp
  unit_system: "metric" | "imperial"
  side_effects?: unknown
  exclude_from_insights: boolean
  created_at: Timestamp
}

export type PostRecord = {
  id: string
  thread_id: string
  author_id: string
  body: string
  is_opening: boolean
  kind: "post" | "check_in"
  week?: number | null
  status: "published" | "pending" | "hidden" | "removed"
  hold_reason?: string | null
  helpful_count: number
  edited_at?: Timestamp | null
  created_at: Timestamp
}

export type MeasurementRecord = { id: string; thread_id: string; post_id?: string | null; metric: string; week: number; value: number }

export const THREAD_FIELDS = [
  "id", "author_id", "kind", "title", "slug", "excerpt", "peptide_slug", "other_peptides", "product_handle", "lot",
  "verified_purchase", "status", "hold_reason", "pinned", "locked", "accepted_post_id", "reply_count", "helpful_count",
  "last_activity_at", "unit_system", "side_effects", "exclude_from_insights", "created_at",
]
export const POST_FIELDS = ["id", "thread_id", "author_id", "body", "is_opening", "kind", "week", "status", "hold_reason", "helpful_count", "edited_at", "created_at"]
export const PROFILE_FIELDS = ["id", "customer_id", "display_name", "handle", "role", "credentials", "bio", "reputation", "status", "created_at"]

const stringList = (value: unknown) => Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []

/** What a post shows about its author. Never the customer ID, email or full name. */
export function publicAuthor(profile?: ProfileRecord | null) {
  if (!profile) {
    return { handle: null, display_name: "Former member", role: "member" as const, credentials: null, level: "Member", level_id: "member", reputation: 0 }
  }
  const level = levelFor(profile.reputation)
  return {
    handle: profile.handle,
    display_name: profile.display_name,
    role: profile.role,
    credentials: profile.role === "expert" ? profile.credentials ?? null : null,
    level: level.name,
    level_id: level.id,
    reputation: profile.reputation,
  }
}

export function publicMember(profile: ProfileRecord) {
  return { ...publicAuthor(profile), bio: profile.bio ?? null, joined_at: profile.created_at }
}

type Context = { authors: Map<string, ProfileRecord>; viewer?: ProfileRecord | null }

/** Moderation details are only shown to the author, who sees why their own post is waiting. */
function moderation(record: { status: string; hold_reason?: string | null }, mine: boolean) {
  return mine ? { status: record.status, hold_reason: record.hold_reason ?? null } : {}
}

export function publicThread(thread: ThreadRecord, { authors, viewer }: Context) {
  const mine = Boolean(viewer) && thread.author_id === viewer?.id
  return {
    id: thread.id,
    kind: thread.kind,
    title: thread.title,
    slug: thread.slug,
    excerpt: thread.excerpt,
    peptide_slug: thread.peptide_slug ?? null,
    other_peptides: stringList(thread.other_peptides),
    product_handle: thread.product_handle ?? null,
    lot: thread.lot ?? null,
    verified_purchase: thread.verified_purchase,
    pinned: thread.pinned,
    locked: thread.locked,
    accepted_post_id: thread.accepted_post_id ?? null,
    reply_count: thread.reply_count,
    helpful_count: thread.helpful_count,
    last_activity_at: thread.last_activity_at,
    created_at: thread.created_at,
    unit_system: thread.unit_system,
    side_effects: stringList(thread.side_effects),
    author: publicAuthor(authors.get(thread.author_id)),
    mine,
    ...moderation(thread, mine),
  }
}

export function publicPost(post: PostRecord, { authors, viewer, voted }: Context & { voted?: Set<string> }) {
  const mine = Boolean(viewer) && post.author_id === viewer?.id
  return {
    id: post.id,
    thread_id: post.thread_id,
    body: post.body,
    is_opening: post.is_opening,
    kind: post.kind,
    week: post.week ?? null,
    helpful_count: post.helpful_count,
    edited_at: post.edited_at ?? null,
    created_at: post.created_at,
    author: publicAuthor(authors.get(post.author_id)),
    mine,
    voted: voted?.has(post.id) ?? false,
    ...moderation(post, mine),
  }
}

export function publicMeasurement(measurement: MeasurementRecord) {
  return { metric: measurement.metric, week: measurement.week, value: measurement.value, post_id: measurement.post_id ?? null }
}

export type PublicThread = ReturnType<typeof publicThread>
export type PublicPost = ReturnType<typeof publicPost>
