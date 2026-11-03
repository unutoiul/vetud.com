import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadProfiles, viewerProfile } from "../../../../../../lib/forum/read"
import { publicPost } from "../../../../../../lib/forum/public"
import { createForumPostWorkflow } from "../../../../../../workflows/forum/posts"
import type { StoreCreateForumPostBody } from "../../../validators"

export async function POST(req: AuthenticatedMedusaRequest<StoreCreateForumPostBody>, res: MedusaResponse) {
  const { result } = await createForumPostWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, thread_id: req.params.id, body: req.validatedBody.body },
  })
  const viewer = await viewerProfile(req.scope, req.auth_context.actor_id)
  res.status(201).json({ post: publicPost(result, { authors: await loadProfiles(req.scope, [result.author_id]), viewer }) })
}
