import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ARTICLE_COMMENT_MODULE } from "../modules/article-comment"
import type ArticleCommentModuleService from "../modules/article-comment/service"

type CreateArticleCommentInput = { customer_id: string; article_slug: string; body: string }
type DeleteArticleCommentInput = { id: string; customer_id?: string }

/** One comment per customer per interval, across all articles. */
const COMMENT_INTERVAL_MS = 30 * 1000

/** "Lucas Franco" → "Lucas F.". Comments never show surnames or email addresses. */
export function publicAuthorName(first?: string | null, last?: string | null) {
  const given = first?.trim()
  const initial = last?.trim().charAt(0).toUpperCase()
  if (!given) return "Vetud reader"
  return initial ? `${given} ${initial}.` : given
}

const prepareArticleCommentStep = createStep(
  "prepare-article-comment",
  async (input: CreateArticleCommentInput, { container }) => {
    const customer = await container.resolve(Modules.CUSTOMER).retrieveCustomer(input.customer_id)
    const comments: ArticleCommentModuleService = container.resolve(ARTICLE_COMMENT_MODULE)
    const [latest] = await comments.listArticleComments(
      { customer_id: input.customer_id },
      { take: 1, order: { created_at: "DESC" }, withDeleted: true }
    )
    if (latest && Date.now() - new Date(latest.created_at).getTime() < COMMENT_INTERVAL_MS) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "You're commenting too quickly. Please wait a moment and try again.")
    }
    return new StepResponse({
      ...input,
      author_name: publicAuthorName(customer.first_name, customer.last_name),
      // Keep paragraphs, but no more than one blank line between them.
      body: input.body.trim().replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n"),
    })
  }
)

const createArticleCommentStep = createStep(
  "create-article-comment",
  async (input: CreateArticleCommentInput & { author_name: string }, { container }) => {
    const comments: ArticleCommentModuleService = container.resolve(ARTICLE_COMMENT_MODULE)
    const comment = await comments.createArticleComments(input)
    return new StepResponse(comment, comment.id)
  },
  async (id, { container }) => {
    if (!id) return
    const comments: ArticleCommentModuleService = container.resolve(ARTICLE_COMMENT_MODULE)
    await comments.deleteArticleComments(id)
  }
)

/** Posts a comment as the signed-in customer, under their first name and last initial. */
export const createArticleCommentWorkflow = createWorkflow(
  "create-article-comment",
  (input: CreateArticleCommentInput) => {
    const prepared = prepareArticleCommentStep(input)
    const comment = createArticleCommentStep(prepared)
    return new WorkflowResponse(comment)
  }
)

/** Soft-deletes a comment. With `customer_id`, only that customer's own comment can be removed. */
const removeArticleCommentStep = createStep(
  "remove-article-comment",
  async (input: DeleteArticleCommentInput, { container }) => {
    const comments: ArticleCommentModuleService = container.resolve(ARTICLE_COMMENT_MODULE)
    const [comment] = await comments.listArticleComments({ id: input.id }, { take: 1 })
    // Someone else's comment answers the same as a missing one.
    if (!comment || (input.customer_id && comment.customer_id !== input.customer_id)) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Comment not found.")
    }
    await comments.softDeleteArticleComments(comment.id)
    return new StepResponse({ id: comment.id }, comment.id)
  },
  async (id, { container }) => {
    if (!id) return
    const comments: ArticleCommentModuleService = container.resolve(ARTICLE_COMMENT_MODULE)
    await comments.restoreArticleComments(id)
  }
)

export const deleteArticleCommentWorkflow = createWorkflow(
  "delete-article-comment",
  (input: DeleteArticleCommentInput) => {
    const removed = removeArticleCommentStep(input)
    return new WorkflowResponse(removed)
  }
)
