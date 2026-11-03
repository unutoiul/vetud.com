import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateForumThreadWorkflow } from "../../../../../workflows/forum/admin"
import type { AdminUpdateForumThreadBody } from "../../validators"

/** Pin, lock, or leave a research log out of the community charts. */
export async function POST(req: AuthenticatedMedusaRequest<AdminUpdateForumThreadBody>, res: MedusaResponse) {
  const { result } = await updateForumThreadWorkflow(req.scope).run({
    input: { thread_id: req.params.id, ...req.validatedBody },
  })
  res.json({ thread: result })
}
