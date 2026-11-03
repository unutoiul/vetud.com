import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { peptideInsights } from "../../../../lib/forum/read"
import type { StoreForumInsightsQueryType } from "../validators"

/** Medians of what members' research logs report for one peptide (only metrics with enough logs). */
export async function GET(req: MedusaRequest<unknown, StoreForumInsightsQueryType>, res: MedusaResponse) {
  res.setHeader("Cache-Control", "public, max-age=300")
  res.json(await peptideInsights(req.scope, req.validatedQuery.peptide))
}
