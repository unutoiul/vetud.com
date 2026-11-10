import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteArticleCommentWorkflow } from "../../../../workflows/article-comments"

/** Customers can delete their own comments only. */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await deleteArticleCommentWorkflow(req.scope).run({
    input: { id: req.params.id, customer_id: req.auth_context.actor_id },
  })

  res.json({ id: result.id, object: "article_comment", deleted: true })
}
