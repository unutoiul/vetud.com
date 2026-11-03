import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { acceptForumAnswerWorkflow } from "../../../../../../workflows/forum/answers"
import type { StoreAcceptForumAnswerBody } from "../../../validators"

/** Chooses (or clears, with `post_id: null`) the best answer to the member's own question. */
export async function POST(req: AuthenticatedMedusaRequest<StoreAcceptForumAnswerBody>, res: MedusaResponse) {
  const { result } = await acceptForumAnswerWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, thread_id: req.params.id, post_id: req.validatedBody.post_id },
  })
  res.json(result)
}
