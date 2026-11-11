import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { screenPost } from "../../lib/forum/moderation"
import type { PostRecord, ThreadRecord } from "../../lib/forum/public"
import { excerptOf, normalizeBody } from "../../lib/forum/text"
import {
  activeProfile,
  assertNotTooSoon,
  findPost,
  findThread,
  forumService,
  recountForumReputationStep,
  recountForumThreadsStep,
  attachImages,
  claimableImages,
  releaseImages,
} from "./shared"

/** One reply per member per interval, across all threads. */
const REPLY_INTERVAL_MS = 20 * 1000
const BODY_MIN = 2
const BODY_MAX = 5000

type NewPost = {
  thread_id: string
  author_id: string
  body: string
  status: "published" | "pending"
  hold_reason: string | null
  image_ids: string[]
}

function cleanBody(body: string) {
  const text = normalizeBody(body)
  if (text.length < BODY_MIN) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Please write a reply first.")
  if (text.length > BODY_MAX) throw new MedusaError(MedusaError.Types.INVALID_DATA, `Replies are limited to ${BODY_MAX} characters.`)
  return text
}

/** Replies go to published, open threads only. */
function assertOpen(thread: ThreadRecord) {
  if (thread.status !== "published") throw new MedusaError(MedusaError.Types.NOT_FOUND, "Thread not found.")
  if (thread.locked) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This thread is closed to new replies.")
}

const createForumPostStep = createStep(
  "create-forum-post",
  async (input: NewPost, { container }) => {
    const service = forumService(container)
    const { image_ids, ...data } = input
    const post = await service.createForumPosts({ ...data, is_opening: false })
    await attachImages(service, image_ids, post.id)
    return new StepResponse(post, { post_id: post.id, image_ids })
  },
  async (created, { container }) => {
    if (!created) return
    const service = forumService(container)
    await releaseImages(service, created.image_ids)
    await service.deleteForumPosts(created.post_id)
  }
)

type CreateForumPostInput = { customer_id: string; thread_id: string; body: string; images?: string[] }

const prepareForumPostStep = createStep(
  "prepare-forum-post",
  async (input: CreateForumPostInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    assertOpen(await findThread(service, input.thread_id))
    const [latest] = await service.listForumPosts({ author_id: profile.id }, { take: 1, order: { created_at: "DESC" }, withDeleted: true })
    assertNotTooSoon(latest, REPLY_INTERVAL_MS, "You're replying too quickly. Please wait a moment and try again.")
    const body = cleanBody(input.body)
    const imageIds = await claimableImages(service, profile.id, input.images)
    const hold = screenPost([body], profile, imageIds.length)
    const post: NewPost = {
      thread_id: input.thread_id,
      author_id: profile.id,
      body,
      status: hold ? "pending" : "published",
      hold_reason: hold,
      image_ids: imageIds,
    }
    return new StepResponse(post)
  }
)

/** Replies to a thread as the signed-in member. */
export const createForumPostWorkflow = createWorkflow(
  "create-forum-post",
  function (input: CreateForumPostInput) {
    const prepared = prepareForumPostStep(input)
    const post = createForumPostStep(prepared)
    recountForumThreadsStep({ thread_ids: transform({ input }, ({ input }) => [input.thread_id]) })
    // Published replies count toward the author's reputation (see lib/forum/reputation.ts).
    recountForumReputationStep({ profile_ids: transform({ post }, ({ post }) => [post.author_id]) })
    return new WorkflowResponse(post)
  }
)

type EditForumPostInput = { customer_id: string; post_id: string; body: string }
type PostSnapshot = Pick<PostRecord, "body" | "status"> & { hold_reason: string | null; edited_at: Date | null }
type ThreadSnapshot = Pick<ThreadRecord, "excerpt" | "status" | "hold_reason">

const editForumPostStep = createStep(
  "edit-forum-post",
  async (input: EditForumPostInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    const post = await findPost(service, input.post_id)
    // Someone else's post answers the same as a missing one.
    if (post.author_id !== profile.id) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Post not found.")
    if (post.status === "removed") throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This post was removed by a moderator.")

    const body = cleanBody(input.body)
    const thread = await findThread(service, post.thread_id)
    // Photos can't be edited, so a post waiting for its photos to be checked keeps waiting.
    const hold = screenPost(post.is_opening ? [thread.title, body] : [body], profile)
      ?? (post.status === "pending" && post.hold_reason === "image" ? "image" : null)
    // An edit can clear an automatic hold, but posts hidden after reports stay hidden until staff review them.
    const status = post.status === "hidden" ? "hidden" : hold ? "pending" : "published"
    const holdReason = post.status === "hidden" ? post.hold_reason ?? null : hold

    const previous: { post: PostSnapshot; thread: ThreadSnapshot | null } = {
      post: { body: post.body, status: post.status, hold_reason: post.hold_reason ?? null, edited_at: post.edited_at ? new Date(post.edited_at) : null },
      thread: post.is_opening ? { excerpt: thread.excerpt, status: thread.status, hold_reason: thread.hold_reason ?? null } : null,
    }
    const updated = await service.updateForumPosts({ id: post.id, body, status, hold_reason: holdReason, edited_at: new Date() })
    if (post.is_opening) {
      await service.updateForumThreads({ id: thread.id, excerpt: excerptOf(body), status, hold_reason: holdReason })
    }
    return new StepResponse(updated, { post_id: post.id, thread_id: thread.id, previous })
  },
  async (undo, { container }) => {
    if (!undo) return
    const service = forumService(container)
    await service.updateForumPosts({ id: undo.post_id, ...undo.previous.post })
    if (undo.previous.thread) await service.updateForumThreads({ id: undo.thread_id, ...undo.previous.thread })
  }
)

/** Edits the member's own post. Edited text goes through the same review rules as new posts. */
export const editForumPostWorkflow = createWorkflow(
  "edit-forum-post",
  function (input: EditForumPostInput) {
    const post = editForumPostStep(input)
    recountForumThreadsStep({ thread_ids: transform({ post }, ({ post }) => [post.thread_id]) })
    // An edit can hold or release a post, which changes what counts toward reputation.
    recountForumReputationStep({ profile_ids: transform({ post }, ({ post }) => [post.author_id]) })
    return new WorkflowResponse(post)
  }
)

type DeleteForumPostInput = { customer_id: string; post_id: string }

const deleteForumPostStep = createStep(
  "delete-forum-post",
  async (input: DeleteForumPostInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    const post = await findPost(service, input.post_id)
    if (post.author_id !== profile.id) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Post not found.")

    // Deleting the opening post deletes the whole thread, replies included.
    const postIds = post.is_opening
      ? (await service.listForumPosts({ thread_id: post.thread_id }, { select: ["id"] })).map(entry => entry.id)
      : [post.id]
    const authorIds = post.is_opening
      ? (await service.listForumPosts({ id: postIds }, { select: ["author_id"] })).map(entry => entry.author_id)
      : [post.author_id]

    await service.softDeleteForumPosts(postIds)
    if (post.is_opening) await service.softDeleteForumThreads(post.thread_id)
    return new StepResponse(
      { id: post.id, thread_id: post.thread_id, author_ids: authorIds },
      { thread_id: post.is_opening ? post.thread_id : null, post_ids: postIds }
    )
  },
  async (undo, { container }) => {
    if (!undo) return
    const service = forumService(container)
    if (undo.thread_id) await service.restoreForumThreads(undo.thread_id)
    await service.restoreForumPosts(undo.post_ids)
  }
)

/** Deletes the member's own post, or their whole thread when it is the opening post. */
export const deleteForumPostWorkflow = createWorkflow(
  "delete-forum-post",
  function (input: DeleteForumPostInput) {
    const deleted = deleteForumPostStep(input)
    recountForumThreadsStep({ thread_ids: transform({ deleted }, ({ deleted }) => [deleted.thread_id]) })
    recountForumReputationStep({ profile_ids: transform({ deleted }, ({ deleted }) => deleted.author_ids) })
    return new WorkflowResponse(transform({ deleted }, ({ deleted }) => ({ id: deleted.id, deleted: true })))
  }
)
