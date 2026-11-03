import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { REPORTS_TO_HIDE } from "../../lib/forum/moderation"
import { normalizeBody } from "../../lib/forum/text"
import { activeProfile, findPost, forumService, recountForumReputationStep, recountForumThreadsStep } from "./shared"

export type ReportReason = "dose" | "medical_claim" | "spam" | "abuse" | "other"
type ReportForumPostInput = { customer_id: string; post_id: string; reason: ReportReason; note?: string | null }

const reportForumPostStep = createStep(
  "report-forum-post",
  async (input: ReportForumPostInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    const post = await findPost(service, input.post_id)
    if (post.status !== "published") throw new MedusaError(MedusaError.Types.NOT_FOUND, "Post not found.")
    if (post.author_id === profile.id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "You can't report your own post.")

    const result = { post_id: post.id, thread_id: post.thread_id, author_id: post.author_id, hidden: false }
    const [existing] = await service.listForumReports({ post_id: post.id, reporter_id: profile.id }, { take: 1 })
    // Each member's report counts once.
    if (existing) return new StepResponse(result, null)

    const report = await service.createForumReports({
      post_id: post.id,
      reporter_id: profile.id,
      reason: input.reason,
      note: input.note ? normalizeBody(input.note).slice(0, 500) || null : null,
    })
    const [, open] = await service.listAndCountForumReports({ post_id: post.id, status: "open" }, { take: 1 })
    const hide = open >= REPORTS_TO_HIDE
    if (hide) {
      await service.updateForumPosts({ id: post.id, status: "hidden", hold_reason: "reports" })
      if (post.is_opening) await service.updateForumThreads({ id: post.thread_id, status: "hidden", hold_reason: "reports" })
    }
    return new StepResponse({ ...result, hidden: hide }, {
      report_id: report.id,
      restore: hide ? { post_id: post.id, thread_id: post.is_opening ? post.thread_id : null, hold_reason: post.hold_reason ?? null } : null,
    })
  },
  async (undo, { container }) => {
    if (!undo) return
    const service = forumService(container)
    await service.deleteForumReports(undo.report_id)
    if (undo.restore) {
      await service.updateForumPosts({ id: undo.restore.post_id, status: "published", hold_reason: undo.restore.hold_reason })
      if (undo.restore.thread_id) await service.updateForumThreads({ id: undo.restore.thread_id, status: "published", hold_reason: undo.restore.hold_reason })
    }
  }
)

/** Reports a post to the moderators. Enough reports hide it until staff review it. */
export const reportForumPostWorkflow = createWorkflow(
  "report-forum-post",
  function (input: ReportForumPostInput) {
    const result = reportForumPostStep(input)
    recountForumThreadsStep({ thread_ids: transform({ result }, ({ result }) => [result.thread_id]) })
    recountForumReputationStep({ profile_ids: transform({ result }, ({ result }) => [result.author_id]) })
    return new WorkflowResponse(transform({ result }, ({ result }) => ({ post_id: result.post_id, reported: true })))
  }
)
