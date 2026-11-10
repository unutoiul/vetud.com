import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { loadImages, loadProfiles, viewerProfile } from "../../../../../lib/forum/read"
import { publicPost } from "../../../../../lib/forum/public"
import { deleteForumPostWorkflow, editForumPostWorkflow } from "../../../../../workflows/forum/posts"
import type { StoreEditForumPostBody } from "../../validators"

/** Edits the signed-in member's own post. */
export async function POST(req: AuthenticatedMedusaRequest<StoreEditForumPostBody>, res: MedusaResponse) {
  const { result } = await editForumPostWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, post_id: req.params.id, body: req.validatedBody.body },
  })
  const viewer = await viewerProfile(req.scope, req.auth_context.actor_id)
  res.json({ post: publicPost(result, { authors: await loadProfiles(req.scope, [result.author_id]), viewer, images: await loadImages(req.scope, [result.id]) }) })
}

/** Deletes the member's own post; deleting the opening post deletes the thread. */
export async function DELETE(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await deleteForumPostWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, post_id: req.params.id },
  })
  res.json(result)
}
