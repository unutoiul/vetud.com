import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { forumStats } from "../../../../lib/forum/read"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "public, max-age=300")
  res.json(await forumStats(req.scope))
}
