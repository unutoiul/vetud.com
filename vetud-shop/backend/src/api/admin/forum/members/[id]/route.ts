import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateForumMemberWorkflow } from "../../../../../workflows/forum/admin"
import type { AdminUpdateForumMemberBody } from "../../validators"

/** Make a member an expert (with credentials) or moderator, or mute or ban them. */
export async function POST(req: AuthenticatedMedusaRequest<AdminUpdateForumMemberBody>, res: MedusaResponse) {
  const { result } = await updateForumMemberWorkflow(req.scope).run({
    input: { profile_id: req.params.id, ...req.validatedBody },
  })
  res.json({ member: result })
}
