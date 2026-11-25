import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { saveBeslimnowSubscriberWorkflow } from "../../../workflows/beslimnow"
import type { BeslimnowSubscriberBody } from "./validators"

/** Saves (or refreshes) one pop-up signup from the BeSlimNow page (server to server; see ../guard.ts). */
export async function POST(req: MedusaRequest<BeslimnowSubscriberBody>, res: MedusaResponse) {
  const { email, country, signup_form } = req.validatedBody
  const { result } = await saveBeslimnowSubscriberWorkflow(req.scope).run({
    input: { email, country: country || null, signup_form },
  })
  res.status(201).json({ subscriber: result })
}
