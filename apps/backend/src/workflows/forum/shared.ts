import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { FORUM_MODULE } from "../../modules/forum"
import type ForumModuleService from "../../modules/forum/service"
import type { PostRecord, ProfileRecord, ThreadRecord } from "../../lib/forum/public"
import { computeReputation } from "../../lib/forum/reputation"

export function forumService(container: MedusaContainer): ForumModuleService {
  return container.resolve(FORUM_MODULE)
}

export async function findProfile(service: ForumModuleService, customerId: string) {
  const [profile] = await service.listForumProfiles({ customer_id: customerId }, { take: 1 })
  return profile as ProfileRecord | undefined
}

/** The signed-in customer's profile, if they may post, vote and report. */
export async function activeProfile(service: ForumModuleService, customerId: string) {
  const profile = await findProfile(service, customerId)
  if (!profile) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Choose your community name before taking part.")
  }
  if (profile.status !== "active") {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your community account can't post right now. Contact us if you think this is a mistake.")
  }
  return profile
}

export async function findThread(service: ForumModuleService, id: string) {
  const [thread] = await service.listForumThreads({ id }, { take: 1 })
  if (!thread) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Thread not found.")
  return thread as ThreadRecord
}

export async function findPost(service: ForumModuleService, id: string) {
  const [post] = await service.listForumPosts({ id }, { take: 1 })
  if (!post) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Post not found.")
  return post as PostRecord
}

/** One action per interval, counted from the member's latest record (deleted ones too). */
export function assertNotTooSoon(latest: { created_at: Date | string } | undefined, intervalMs: number, message: string) {
  if (latest && Date.now() - new Date(latest.created_at).getTime() < intervalMs) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, message)
  }
}

const unique = (ids: (string | null | undefined)[]) => [...new Set(ids.filter((id): id is string => Boolean(id)))]

/**
 * Recounts what lists show for each thread: published replies, latest activity and the opening
 * post's helpful votes. Derived values, so there is nothing to undo.
 */
export const recountForumThreadsStep = createStep(
  "recount-forum-threads",
  async (input: { thread_ids: (string | null | undefined)[] }, { container }) => {
    const service = forumService(container)
    for (const id of unique(input.thread_ids)) {
      const [thread] = await service.listForumThreads({ id }, { take: 1 })
      if (!thread) continue
      const [latest, replyCount] = await service.listAndCountForumPosts(
        { thread_id: id, is_opening: false, status: "published" },
        { take: 1, order: { created_at: "DESC" } }
      )
      const [opening] = await service.listForumPosts({ thread_id: id, is_opening: true }, { take: 1 })
      await service.updateForumThreads({
        id,
        reply_count: replyCount,
        helpful_count: opening?.helpful_count ?? 0,
        last_activity_at: latest[0]?.created_at ?? thread.created_at,
      })
    }
    return new StepResponse(undefined)
  }
)

/** Recounts reputation from the members' votes, best answers, logs and removed posts. */
export const recountForumReputationStep = createStep(
  "recount-forum-reputation",
  async (input: { profile_ids: (string | null | undefined)[] }, { container }) => {
    const service = forumService(container)
    for (const id of unique(input.profile_ids)) {
      const published = await service.listForumPosts({ author_id: id, status: "published" }, { select: ["id", "helpful_count"] })
      const postIds = published.map(post => post.id)
      const [, bestAnswers] = postIds.length
        ? await service.listAndCountForumThreads({ accepted_post_id: postIds, status: "published" }, { take: 1 })
        : [[], 0]
      const [, publishedLogs] = await service.listAndCountForumThreads({ author_id: id, kind: "research_log", status: "published" }, { take: 1 })
      const [, removedPosts] = await service.listAndCountForumPosts({ author_id: id, status: "removed" }, { take: 1 })
      await service.updateForumProfiles({
        id,
        reputation: computeReputation({
          helpfulVotes: published.reduce((total, post) => total + (post.helpful_count ?? 0), 0),
          bestAnswers,
          publishedLogs,
          removedPosts,
        }),
      })
    }
    return new StepResponse(undefined)
  }
)

/** Recounts a post's helpful votes. */
export async function recountPostVotes(service: ForumModuleService, postId: string) {
  const [, votes] = await service.listAndCountForumVotes({ post_id: postId }, { take: 1 })
  await service.updateForumPosts({ id: postId, helpful_count: votes })
}
