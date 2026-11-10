import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createArticleCommentWorkflow } from "../../../workflows/article-comments"
import type { StoreArticleCommentsQueryType, StoreCreateArticleCommentBody } from "./validators"

type CommentRecord = { id: string; customer_id: string; author_name: string; body: string; created_at: Date | string }

/** The public shape: never the customer ID, only whether the viewer wrote it. */
function publicComment({ id, customer_id, author_name, body, created_at }: CommentRecord, viewerId?: string) {
  return { id, author_name, body, created_at, mine: Boolean(viewerId) && customer_id === viewerId }
}

/** Newest first. Works signed out; signed in, the viewer's own comments are flagged so they can delete them. */
export async function GET(req: AuthenticatedMedusaRequest<unknown, StoreArticleCommentsQueryType>, res: MedusaResponse) {
  const { article, offset, limit } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "article_comment",
    fields: ["id", "customer_id", "author_name", "body", "created_at"],
    filters: { article_slug: article },
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.setHeader("Cache-Control", "private, no-store")
  res.json({
    comments: (data as CommentRecord[]).map(comment => publicComment(comment, req.auth_context?.actor_id)),
    count: metadata?.count ?? data.length,
    offset,
    limit,
  })
}

export async function POST(req: AuthenticatedMedusaRequest<StoreCreateArticleCommentBody>, res: MedusaResponse) {
  const { result } = await createArticleCommentWorkflow(req.scope).run({
    input: {
      // The author is always the signed-in customer, never a value from the request body.
      customer_id: req.auth_context.actor_id,
      article_slug: req.validatedBody.article,
      body: req.validatedBody.body,
    },
  })

  res.status(201).json({ comment: publicComment(result, req.auth_context.actor_id) })
}
