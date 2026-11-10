import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { confirmEmailListWorkflow } from "../../../../workflows/email-list"
import type { StoreConfirmEmailListBody } from "../validators"

export async function POST(req: MedusaRequest<StoreConfirmEmailListBody>, res: MedusaResponse) {
  await confirmEmailListWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ success: true })
}
