import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { lotReportCounts } from "../../../../lib/forum/read"
import type { StoreForumLotCountsQueryType } from "../validators"

/** How many published member reports mention each lot, e.g. `?lots=VTD01-2609A,VTD01-2607B`. */
export async function GET(req: MedusaRequest<unknown, StoreForumLotCountsQueryType>, res: MedusaResponse) {
  res.setHeader("Cache-Control", "public, max-age=300")
  res.json({ counts: await lotReportCounts(req.scope, req.validatedQuery.lots) })
}
