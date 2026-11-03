import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import type { ProfileRecord, ThreadRecord } from "../../lib/forum/public"
import { normalizeTitle } from "../../lib/forum/text"
import { findPost, findThread, forumService, recountForumReputationStep, recountForumThreadsStep } from "./shared"

export type ModerationAction = "approve" | "hide" | "remove"
type ModerateForumPostInput = { post_id: string; action: ModerationAction }

const STATUS_FOR: Record<ModerationAction, "published" | "hidden" | "removed"> = { approve: "published", hide: "hidden", remove: "removed" }

const moderateForumPostStep = createStep(
  "moderate-forum-post",
  async (input: ModerateForumPostInput, { container }) => {
    const service = forumService(container)
    const post = await findPost(service, input.post_id)
    const status = STATUS_FOR[input.action]
    const holdReason = input.action === "approve" ? null : "staff"
    const previous = { status: post.status, hold_reason: post.hold_reason ?? null }

    await service.updateForumPosts({ id: post.id, status, hold_reason: holdReason })
    // A thread is only as visible as its opening post.
    if (post.is_opening) await service.updateForumThreads({ id: post.thread_id, status, hold_reason: holdReason })
    // Staff have reviewed the post, so its open reports are settled either way.
    const reports = await service.listForumReports({ post_id: post.id, status: "open" }, { select: ["id"] })
    if (reports.length) await service.updateForumReports(reports.map(report => ({ id: report.id, status: "resolved" as const })))

    return new StepResponse(
      { post_id: post.id, thread_id: post.thread_id, author_id: post.author_id, status },
      { post_id: post.id, thread_id: post.is_opening ? post.thread_id : null, previous, report_ids: reports.map(report => report.id) }
    )
  },
  async (undo, { container }) => {
    if (!undo) return
    const service = forumService(container)
    await service.updateForumPosts({ id: undo.post_id, ...undo.previous })
    if (undo.thread_id) await service.updateForumThreads({ id: undo.thread_id, ...undo.previous })
    if (undo.report_ids.length) await service.updateForumReports(undo.report_ids.map(id => ({ id, status: "open" as const })))
  }
)

/** Approves, hides or removes a post from Admin > Community. Removed posts cost the author reputation. */
export const moderateForumPostWorkflow = createWorkflow(
  "moderate-forum-post",
  function (input: ModerateForumPostInput) {
    const result = moderateForumPostStep(input)
    recountForumThreadsStep({ thread_ids: transform({ result }, ({ result }) => [result.thread_id]) })
    recountForumReputationStep({ profile_ids: transform({ result }, ({ result }) => [result.author_id]) })
    return new WorkflowResponse(result)
  }
)

type UpdateForumThreadInput = { thread_id: string; pinned?: boolean; locked?: boolean; exclude_from_insights?: boolean }
type ThreadFlags = Pick<ThreadRecord, "pinned" | "locked" | "exclude_from_insights">

const updateForumThreadStep = createStep(
  "update-forum-thread",
  async (input: UpdateForumThreadInput, { container }) => {
    const service = forumService(container)
    const thread = await findThread(service, input.thread_id)
    const { thread_id, ...changes } = input
    const previous: ThreadFlags = { pinned: thread.pinned, locked: thread.locked, exclude_from_insights: thread.exclude_from_insights }
    const updated = await service.updateForumThreads({ id: thread_id, ...changes })
    return new StepResponse(updated, { id: thread_id, previous })
  },
  async (undo, { container }) => {
    if (!undo) return
    await forumService(container).updateForumThreads({ id: undo.id, ...undo.previous })
  }
)

/** Pins, locks, or leaves a research log out of the community charts. */
export const updateForumThreadWorkflow = createWorkflow(
  "update-forum-thread",
  function (input: UpdateForumThreadInput) {
    return new WorkflowResponse(updateForumThreadStep(input))
  }
)

type UpdateForumMemberInput = {
  profile_id: string
  role?: ProfileRecord["role"]
  credentials?: string | null
  status?: ProfileRecord["status"]
}
type MemberFields = Pick<ProfileRecord, "role" | "status"> & { credentials: string | null }

const updateForumMemberStep = createStep(
  "update-forum-member",
  async (input: UpdateForumMemberInput, { container }) => {
    const service = forumService(container)
    const [profile] = await service.listForumProfiles({ id: input.profile_id }, { take: 1 })
    if (!profile) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Member not found.")
    const credentials = input.credentials === undefined ? profile.credentials ?? null : normalizeTitle(input.credentials ?? "").slice(0, 80) || null
    const role = input.role ?? profile.role
    if (role === "expert" && !credentials) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Add the expert's credentials (for example, \"MD, endocrinology\"). They appear next to every answer.")
    }
    const previous: MemberFields = { role: profile.role, status: profile.status, credentials: profile.credentials ?? null }
    const updated = await service.updateForumProfiles({ id: profile.id, role, credentials, status: input.status ?? profile.status })
    return new StepResponse(updated, { id: profile.id, previous })
  },
  async (undo, { container }) => {
    if (!undo) return
    await forumService(container).updateForumProfiles({ id: undo.id, ...undo.previous })
  }
)

/** Sets a member's role (expert or moderator, with credentials) or mutes or bans them. */
export const updateForumMemberWorkflow = createWorkflow(
  "update-forum-member",
  function (input: UpdateForumMemberInput) {
    return new WorkflowResponse(updateForumMemberStep(input))
  }
)
