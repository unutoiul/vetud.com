import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { AdminArticleCommentsQueryType } from "./validators"

/** Every article's comments, newest first, for moderation in Admin > Article comments. */
export async function GET(req: AuthenticatedMedusaRequest<unknown, AdminArticleCommentsQueryType>, res: MedusaResponse) {
  const { article, offset, limit } = req.validatedQuery
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "article_comment",
    fields: ["id", "article_slug", "customer_id", "author_name", "body", "created_at"],
    filters: article ? { article_slug: article } : {},
    pagination: { skip: offset, take: limit, order: { created_at: "DESC" } },
  })

  res.json({ comments: data, count: metadata?.count ?? data.length, offset, limit })
}
