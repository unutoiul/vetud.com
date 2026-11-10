import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { unsubscribeEmailListWorkflow } from "../../../../workflows/email-list"
import type { StoreUnsubscribeEmailListBody } from "../validators"

export async function POST(req: MedusaRequest<StoreUnsubscribeEmailListBody>, res: MedusaResponse) {
  await unsubscribeEmailListWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ success: true })
}
