import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { activeProfile, findPost, forumService, recountForumReputationStep, recountForumThreadsStep, recountPostVotes } from "./shared"

type ForumVoteInput = { customer_id: string; post_id: string }

const prepareForumVoteStep = createStep(
  "prepare-forum-vote",
  async (input: ForumVoteInput, { container }) => {
    const service = forumService(container)
    const profile = await activeProfile(service, input.customer_id)
    const post = await findPost(service, input.post_id)
    if (post.status !== "published") throw new MedusaError(MedusaError.Types.NOT_FOUND, "Post not found.")
    if (post.author_id === profile.id) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "You can't mark your own post as helpful.")
    return new StepResponse({ profile_id: profile.id, post_id: post.id, thread_id: post.thread_id, author_id: post.author_id })
  }
)

type PreparedVote = { profile_id: string; post_id: string; thread_id: string; author_id: string }

const addForumVoteStep = createStep(
  "add-forum-vote",
  async (input: PreparedVote, { container }) => {
    const service = forumService(container)
    const [existing] = await service.listForumVotes({ post_id: input.post_id, profile_id: input.profile_id }, { take: 1 })
    // Voting twice is harmless: the first vote stands.
    if (existing) return new StepResponse(input, null)
    const vote = await service.createForumVotes({ post_id: input.post_id, profile_id: input.profile_id })
    await recountPostVotes(service, input.post_id)
    return new StepResponse(input, vote.id)
  },
  async (voteId, { container }) => {
    if (!voteId) return
    const service = forumService(container)
    const [vote] = await service.listForumVotes({ id: voteId }, { take: 1 })
    await service.deleteForumVotes(voteId)
    if (vote) await recountPostVotes(service, vote.post_id)
  }
)

const removeForumVoteStep = createStep(
  "remove-forum-vote",
  async (input: PreparedVote, { container }) => {
    const service = forumService(container)
    const [existing] = await service.listForumVotes({ post_id: input.post_id, profile_id: input.profile_id }, { take: 1 })
    if (!existing) return new StepResponse(input, null)
    await service.softDeleteForumVotes(existing.id)
    await recountPostVotes(service, input.post_id)
    return new StepResponse(input, { id: existing.id, post_id: input.post_id })
  },
  async (removed, { container }) => {
    if (!removed) return
    const service = forumService(container)
    await service.restoreForumVotes(removed.id)
    await recountPostVotes(service, removed.post_id)
  }
)

/** Marks a post as helpful. Votes add to the author's reputation and rank threads under "Top". */
export const addForumVoteWorkflow = createWorkflow(
  "add-forum-vote",
  function (input: ForumVoteInput) {
    const prepared = prepareForumVoteStep(input)
    const vote = addForumVoteStep(prepared)
    recountForumThreadsStep({ thread_ids: transform({ vote }, ({ vote }) => [vote.thread_id]) })
    recountForumReputationStep({ profile_ids: transform({ vote }, ({ vote }) => [vote.author_id]) })
    return new WorkflowResponse(transform({ vote }, ({ vote }) => ({ post_id: vote.post_id, voted: true })))
  }
)

export const removeForumVoteWorkflow = createWorkflow(
  "remove-forum-vote",
  function (input: ForumVoteInput) {
    const prepared = prepareForumVoteStep(input).config({ name: "prepare-forum-vote-removal" })
    const vote = removeForumVoteStep(prepared)
    recountForumThreadsStep({ thread_ids: transform({ vote }, ({ vote }) => [vote.thread_id]) })
    recountForumReputationStep({ profile_ids: transform({ vote }, ({ vote }) => [vote.author_id]) })
    return new WorkflowResponse(transform({ vote }, ({ vote }) => ({ post_id: vote.post_id, voted: false })))
  }
)
