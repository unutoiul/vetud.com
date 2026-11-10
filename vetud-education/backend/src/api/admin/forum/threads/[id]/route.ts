import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateForumThreadWorkflow } from "../../../../../workflows/forum/admin"
import type { AdminUpdateForumThreadBody } from "../../validators"

/** Pin or lock a thread. */
export async function POST(req: AuthenticatedMedusaRequest<AdminUpdateForumThreadBody>, res: MedusaResponse) {
  const { result } = await updateForumThreadWorkflow(req.scope).run({
    input: { thread_id: req.params.id, ...req.validatedBody },
  })
  res.json({ thread: result })
}
