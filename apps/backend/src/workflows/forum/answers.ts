import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { activeProfile, findPost, findThread, forumService, recountForumReputationStep } from "./shared"

type AcceptAnswerInput = { customer_id: string; thread_id: string; post_id: string | null }

const acceptForumAnswerStep = createStep(
  "accept-forum-answer",
  async (input: AcceptAnswerInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    const thread = await findThread(service, input.thread_id)
    if (thread.kind !== "question" || thread.status !== "published") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only published questions have a best answer.")
    }
    if (thread.author_id !== profile.id && profile.role !== "moderator") {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only the person who asked can choose the best answer.")
    }

    let authorId: string | null = null
    if (input.post_id) {
      const post = await findPost(service, input.post_id)
      if (post.thread_id !== thread.id || post.is_opening || post.status !== "published") {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose a published reply in this thread.")
      }
      if (post.author_id === thread.author_id) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, "You can't choose your own reply as the best answer.")
      }
      authorId = post.author_id
    }

    const previousId = thread.accepted_post_id ?? null
    const [previous] = previousId ? await service.listForumPosts({ id: previousId }, { take: 1, withDeleted: true }) : []
    await service.updateForumThreads({ id: thread.id, accepted_post_id: input.post_id })
    return new StepResponse(
      { thread_id: thread.id, accepted_post_id: input.post_id, author_ids: [authorId, previous?.author_id ?? null] },
      { thread_id: thread.id, previous: previousId }
    )
  },
  async (undo, { container }) => {
    if (!undo) return
    await forumService(container).updateForumThreads({ id: undo.thread_id, accepted_post_id: undo.previous })
  }
)

/** Marks (or, with `post_id: null`, clears) a question's best answer. The answer's author earns reputation. */
export const acceptForumAnswerWorkflow = createWorkflow(
  "accept-forum-answer",
  function (input: AcceptAnswerInput) {
    const result = acceptForumAnswerStep(input)
    recountForumReputationStep({ profile_ids: transform({ result }, ({ result }) => result.author_ids) })
    return new WorkflowResponse(transform({ result }, ({ result }) => ({ thread_id: result.thread_id, accepted_post_id: result.accepted_post_id })))
  }
)
