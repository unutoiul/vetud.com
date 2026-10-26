import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getNmiConfig } from "../../../../lib/nmi-config"

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  res.setHeader("Cache-Control", "no-store")
  res.json(getNmiConfig())
}
