import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { threadDetail, viewerProfile } from "../../../../../lib/forum/read"
import type { StoreForumThreadQueryType } from "../../validators"

/** A thread with a page of replies. Signed in, the reader's own posts waiting for review are included. */
export async function GET(req: AuthenticatedMedusaRequest<unknown, StoreForumThreadQueryType>, res: MedusaResponse) {
  const { offset, limit } = req.validatedQuery
  const viewer = await viewerProfile(req.scope, req.auth_context?.actor_id)
  const detail = await threadDetail(req.scope, req.params.id, viewer, { offset, limit })
  if (!detail) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Thread not found.")

  res.setHeader("Cache-Control", viewer ? "private, no-store" : "public, max-age=30")
  res.json(detail)
}
