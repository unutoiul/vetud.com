import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteArticleCommentWorkflow } from "../../../../workflows/article-comments"

export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await deleteArticleCommentWorkflow(req.scope).run({ input: { id: req.params.id } })

  res.json({ id: result.id, object: "article_comment", deleted: true })
}
