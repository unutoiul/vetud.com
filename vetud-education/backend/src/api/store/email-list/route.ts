import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { subscribeEmailListWorkflow } from "../../../workflows/email-list"
import type { StoreEmailListBody } from "./validators"

/** Sign-up from the education site. The answer is the same whether or not the email was already known. */
export async function POST(req: MedusaRequest<StoreEmailListBody>, res: MedusaResponse) {
  const { email, locale } = req.validatedBody
  await subscribeEmailListWorkflow(req.scope).run({ input: { email, locale } })
  res.status(201).json({ success: true })
}
