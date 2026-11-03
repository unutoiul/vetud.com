import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  POST_FIELDS,
  PROFILE_FIELDS,
  THREAD_FIELDS,
  publicAuthor,
  publicMember,
  publicPost,
  publicThread,
  type ImageRecord,
  type PublicImage,
  type PostRecord,
  type ProfileRecord,
  type ThreadRecord,
} from "./public"

/**
 * Read models for the community API. Everything public goes through the projections in
 * ./public, so customer IDs never leave the backend.
 */

export type ThreadFilters = {
  kind?: ThreadRecord["kind"]
  peptides?: string[]
  lot?: string
  product?: string
  author?: string
  q?: string
  sort: "latest" | "top" | "unanswered"
  offset: number
  limit: number
}

const queryOf = (container: MedusaContainer) => container.resolve(ContainerRegistrationKeys.QUERY)
const unique = (ids: (string | null | undefined)[]) => [...new Set(ids.filter((id): id is string => Boolean(id)))]
const escapeLike = (text: string) => text.replace(/[\\%_]/g, character => `\\${character}`)

export async function loadProfiles(container: MedusaContainer, ids: (string | null | undefined)[]) {
  const wanted = unique(ids)
  if (!wanted.length) return new Map<string, ProfileRecord>()
  const { data } = await queryOf(container).graph({ entity: "forum_profile", fields: PROFILE_FIELDS, filters: { id: wanted } })
  return new Map((data as ProfileRecord[]).map(profile => [profile.id, profile]))
}

/** Each post's photos, oldest upload first. */
export async function loadImages(container: MedusaContainer, postIds: (string | null | undefined)[]) {
  const wanted = unique(postIds)
  const byPost = new Map<string, PublicImage[]>()
  if (!wanted.length) return byPost
  const { data } = await queryOf(container).graph({
    entity: "forum_image",
    fields: ["id", "post_id", "url", "created_at"],
    filters: { post_id: wanted },
    pagination: { order: { created_at: "ASC" } },
  })
  for (const image of data as ImageRecord[]) {
    if (!image.post_id) continue
    byPost.set(image.post_id, [...(byPost.get(image.post_id) ?? []), { id: image.id, url: image.url }])
  }
  return byPost
}

export async function viewerProfile(container: MedusaContainer, customerId?: string | null) {
  if (!customerId) return null
  const { data } = await queryOf(container).graph({ entity: "forum_profile", fields: PROFILE_FIELDS, filters: { customer_id: customerId } })
  return (data[0] as ProfileRecord | undefined) ?? null
}

async function profileByHandle(container: MedusaContainer, handle: string) {
  const { data } = await queryOf(container).graph({ entity: "forum_profile", fields: PROFILE_FIELDS, filters: { handle } })
  return (data[0] as ProfileRecord | undefined) ?? null
}

/** Published threads, pinned first under "Latest". */
export async function listThreads(container: MedusaContainer, filters: ThreadFilters, viewer: ProfileRecord | null) {
  const where: Record<string, unknown> = { status: "published" }
  if (filters.kind) where.kind = filters.kind
  if (filters.peptides?.length) where.peptide_slug = filters.peptides
  if (filters.lot) where.lot = filters.lot
  if (filters.product) where.product_handle = filters.product
  if (filters.q) where.title = { $ilike: `%${escapeLike(filters.q)}%` }
  if (filters.sort === "unanswered") {
    where.kind = filters.kind ?? "question"
    where.reply_count = 0
  }
  if (filters.author) {
    const author = await profileByHandle(container, filters.author)
    if (!author) return { threads: [], count: 0 }
    where.author_id = author.id
  }
  const order = filters.sort === "top"
    ? { helpful_count: "DESC", reply_count: "DESC", created_at: "DESC" }
    : filters.sort === "unanswered"
      ? { created_at: "DESC" }
      : { pinned: "DESC", last_activity_at: "DESC" }

  const { data, metadata } = await queryOf(container).graph({
    entity: "forum_thread",
    fields: THREAD_FIELDS,
    filters: where,
    pagination: { skip: filters.offset, take: filters.limit, order },
  })
  const threads = data as ThreadRecord[]
  const authors = await loadProfiles(container, threads.map(thread => thread.author_id))
  return { threads: threads.map(thread => publicThread(thread, { authors, viewer })), count: metadata?.count ?? threads.length }
}

/**
 * One thread with its opening post, a page of replies (oldest first) and the accepted answer. Threads and replies waiting for review are only returned to
 * their author.
 */
export async function threadDetail(container: MedusaContainer, id: string, viewer: ProfileRecord | null, page: { offset: number; limit: number }) {
  const query = queryOf(container)
  const { data: threads } = await query.graph({ entity: "forum_thread", fields: THREAD_FIELDS, filters: { id } })
  const thread = threads[0] as ThreadRecord | undefined
  const mine = Boolean(viewer) && thread?.author_id === viewer?.id
  if (!thread || (thread.status !== "published" && !(mine && thread.status === "pending"))) return null

  const visible: Record<string, unknown> = viewer
    ? { $or: [{ status: "published" }, { status: "pending", author_id: viewer.id }] }
    : { status: "published" }
  const replyFilters: Record<string, unknown> = { thread_id: id, is_opening: false, ...visible }
  const [{ data: openings }, { data: replies, metadata }] = await Promise.all([
    query.graph({ entity: "forum_post", fields: POST_FIELDS, filters: { thread_id: id, is_opening: true } }),
    query.graph({
      entity: "forum_post",
      fields: POST_FIELDS,
      filters: replyFilters,
      pagination: { skip: page.offset, take: page.limit, order: { created_at: "ASC" } },
    }),
  ])
  const opening = openings[0] as PostRecord | undefined
  if (!opening) return null

  const posts = replies as PostRecord[]
  let accepted: PostRecord | undefined = posts.find(post => post.id === thread.accepted_post_id)
  if (thread.accepted_post_id && !accepted) {
    const { data } = await query.graph({ entity: "forum_post", fields: POST_FIELDS, filters: { id: thread.accepted_post_id, status: "published" } })
    accepted = data[0] as PostRecord | undefined
  }

  const shownIds = unique([opening.id, ...posts.map(post => post.id), accepted?.id])
  const [authors, voted, images] = await Promise.all([
    loadProfiles(container, [thread.author_id, opening.author_id, accepted?.author_id, ...posts.map(post => post.author_id)]),
    viewer
      ? query.graph({ entity: "forum_vote", fields: ["post_id"], filters: { profile_id: viewer.id, post_id: shownIds } })
        .then(({ data }) => new Set((data as { post_id: string }[]).map(vote => vote.post_id)))
      : Promise.resolve(new Set<string>()),
    loadImages(container, shownIds),
  ])
  const context = { authors, viewer, voted, images }

  return {
    thread: publicThread(thread, context),
    opening: publicPost(opening, context),
    posts: posts.map(post => publicPost(post, context)),
    accepted: accepted ? publicPost(accepted, context) : null,
    count: metadata?.count ?? posts.length,
    offset: page.offset,
    limit: page.limit,
    viewer: {
      profile: viewer ? publicAuthor(viewer) : null,
      can_accept: thread.kind === "question" && Boolean(viewer) && (mine || viewer?.role === "moderator"),
    },
  }
}

/** Published threads per lot number, for the documentation pages. */
export async function lotReportCounts(container: MedusaContainer, lots: string[]) {
  if (!lots.length) return {}
  const { data } = await queryOf(container).graph({ entity: "forum_thread", fields: ["lot"], filters: { lot: lots, status: "published" } })
  const counts: Record<string, number> = {}
  for (const { lot } of data as { lot: string }[]) counts[lot] = (counts[lot] ?? 0) + 1
  return counts
}

async function count(container: MedusaContainer, entity: string, filters: Record<string, unknown>) {
  const { metadata, data } = await queryOf(container).graph({ entity, fields: ["id"], filters, pagination: { skip: 0, take: 1 } })
  return metadata?.count ?? data.length
}

export async function forumStats(container: MedusaContainer) {
  const [threads, members, experts] = await Promise.all([
    count(container, "forum_thread", { status: "published" }),
    count(container, "forum_profile", { status: "active" }),
    count(container, "forum_profile", { role: "expert", status: "active" }),
  ])
  return { threads, members, experts }
}

/** A member's public page: profile, totals and their latest published threads. */
export async function memberPage(container: MedusaContainer, handle: string, viewer: ProfileRecord | null) {
  const profile = await profileByHandle(container, handle)
  if (!profile || profile.status === "banned") return null
  const [threads, replies, recent] = await Promise.all([
    count(container, "forum_thread", { author_id: profile.id, status: "published" }),
    count(container, "forum_post", { author_id: profile.id, status: "published", is_opening: false }),
    listThreads(container, { author: handle, sort: "latest", offset: 0, limit: 10 }, viewer),
  ])
  return { member: publicMember(profile), totals: { threads, replies }, threads: recent.threads }
}
