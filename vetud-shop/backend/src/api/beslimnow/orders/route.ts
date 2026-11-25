import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { saveBeslimnowOrderWorkflow } from "../../../workflows/beslimnow"
import type { BeslimnowOrderBody } from "./validators"

/** Saves one order from the BeSlimNow page (server to server; see ../guard.ts). */
export async function POST(req: MedusaRequest<BeslimnowOrderBody>, res: MedusaResponse) {
  const { result } = await saveBeslimnowOrderWorkflow(req.scope).run({ input: req.validatedBody })
  res.status(201).json({ order: result })
}
