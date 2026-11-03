import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addForumVoteWorkflow, removeForumVoteWorkflow } from "../../../../../../workflows/forum/votes"

/** Marks a post as helpful. */
export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await addForumVoteWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, post_id: req.params.id },
  })
  res.json(result)
}

/** Takes back a helpful vote. */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await removeForumVoteWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, post_id: req.params.id },
  })
  res.json(result)
}
