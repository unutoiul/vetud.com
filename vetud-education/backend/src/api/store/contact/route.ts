import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendContactMessageWorkflow } from "../../../workflows/send-contact-message"
import type { StoreContactBody } from "./validators"

export async function POST(req: MedusaRequest<StoreContactBody>, res: MedusaResponse) {
  const { website: _honeypot, ...message } = req.validatedBody

  await sendContactMessageWorkflow(req.scope).run({ input: message })

  res.status(201).json({ success: true })
}
