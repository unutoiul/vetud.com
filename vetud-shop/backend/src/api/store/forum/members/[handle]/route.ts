import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { memberPage, viewerProfile } from "../../../../../lib/forum/read"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const viewer = await viewerProfile(req.scope, req.auth_context?.actor_id)
  const page = await memberPage(req.scope, req.params.handle, viewer)
  if (!page) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Member not found.")
  res.setHeader("Cache-Control", viewer ? "private, no-store" : "public, max-age=60")
  res.json(page)
}
