import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { unsubscribeNewsletterWorkflow } from "../../../../workflows/newsletter"
import type { StoreNewsletterUnsubscribeBody } from "../validators"

export async function POST(req: MedusaRequest<StoreNewsletterUnsubscribeBody>, res: MedusaResponse) {
  await unsubscribeNewsletterWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ success: true })
}
