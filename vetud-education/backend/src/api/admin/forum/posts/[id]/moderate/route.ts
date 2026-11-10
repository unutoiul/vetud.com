import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { moderateForumPostWorkflow } from "../../../../../../workflows/forum/admin"
import type { AdminModerateForumPostBody } from "../../../validators"

/** Approve, hide or remove a post. Its open reports are resolved either way. */
export async function POST(req: AuthenticatedMedusaRequest<AdminModerateForumPostBody>, res: MedusaResponse) {
  const { result } = await moderateForumPostWorkflow(req.scope).run({
    input: { post_id: req.params.id, action: req.validatedBody.action },
  })
  res.json(result)
}
