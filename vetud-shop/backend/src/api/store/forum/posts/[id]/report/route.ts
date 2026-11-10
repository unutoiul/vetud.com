import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { reportForumPostWorkflow } from "../../../../../../workflows/forum/reports"
import type { StoreReportForumPostBody } from "../../../validators"

export async function POST(req: AuthenticatedMedusaRequest<StoreReportForumPostBody>, res: MedusaResponse) {
  const { result } = await reportForumPostWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, post_id: req.params.id, reason: req.validatedBody.reason, note: req.validatedBody.note },
  })
  res.status(201).json(result)
}
