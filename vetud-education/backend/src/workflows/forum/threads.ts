import type { ForumTopic } from "../../lib/forum/topics"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { screenPost } from "../../lib/forum/moderation"
import { excerptOf, normalizeBody, normalizeTitle, slugify } from "../../lib/forum/text"
import { activeProfile, assertNotTooSoon, attachImages, claimableImages, forumService, releaseImages } from "./shared"

export type ThreadKind = "discussion" | "question"

export type CreateForumThreadInput = {
  customer_id: string
  kind: ThreadKind
  title: string
  body: string
  topic?: ForumTopic
  peptide_slug?: string | null
  images?: string[]
}

/** One new thread per member per interval. */
const THREAD_INTERVAL_MS = 2 * 60 * 1000

type PreparedThread = {
  profile_id: string
  thread: {
    author_id: string
    kind: ThreadKind
    title: string
    slug: string
    excerpt: string
    topic: ForumTopic
    peptide_slug: string | null
    status: "published" | "pending"
    hold_reason: string | null
  }
  body: string
  image_ids: string[]
}

const prepareForumThreadStep = createStep(
  "prepare-forum-thread",
  async (input: CreateForumThreadInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    const [latest] = await service.listForumThreads({ author_id: profile.id }, { take: 1, order: { created_at: "DESC" }, withDeleted: true })
    assertNotTooSoon(latest, THREAD_INTERVAL_MS, "You're starting threads too quickly. Please wait a couple of minutes and try again.")

    const title = normalizeTitle(input.title)
    const body = normalizeBody(input.body)
    if (title.length < 8) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please give your thread a clearer title.")
    if (body.length < 20) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please write a little more, so others can help.")

    const imageIds = await claimableImages(service, profile.id, input.images)
    const hold = screenPost([title, body], profile, imageIds.length)
    const prepared: PreparedThread = {
      profile_id: profile.id,
      thread: {
        author_id: profile.id,
        kind: input.kind,
        title,
        slug: slugify(title),
        excerpt: excerptOf(body),
        topic: input.topic ?? "general",
        peptide_slug: input.peptide_slug ?? null,
        status: hold ? "pending" : "published",
        hold_reason: hold,
      },
      body,
      image_ids: imageIds,
    }
    return new StepResponse(prepared)
  }
)

const createForumThreadStep = createStep(
  "create-forum-thread",
  async (input: PreparedThread, { container }) => {
    const service = forumService(container)
    const thread = await service.createForumThreads({ ...input.thread, last_activity_at: new Date() })
    const post = await service.createForumPosts({
      thread_id: thread.id,
      author_id: input.profile_id,
      body: input.body,
      is_opening: true,
      status: input.thread.status,
      hold_reason: input.thread.hold_reason,
    })
    await attachImages(service, input.image_ids, post.id)
    return new StepResponse({ thread, post }, { thread_id: thread.id, post_id: post.id, image_ids: input.image_ids })
  },
  async (created, { container }) => {
    if (!created) return
    const service = forumService(container)
    await releaseImages(service, created.image_ids)
    await service.deleteForumPosts(created.post_id)
    await service.deleteForumThreads(created.thread_id)
  }
)

/**
 * Starts a discussion or question as the signed-in member. Posts with dose amounts
 * (or a new member's links) wait for review; everything else is published straight away.
 */
export const createForumThreadWorkflow = createWorkflow(
  "create-forum-thread",
  function (input: CreateForumThreadInput) {
    const prepared = prepareForumThreadStep(input)
    const created = createForumThreadStep(prepared)
    return new WorkflowResponse(created)
  }
)
