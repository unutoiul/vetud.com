import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requestEmailChangeCodeWorkflow } from "../../../../../workflows/account"
import type { StoreEmailChangeCodeBody } from "../../validators"

/** POST /store/account/email/code { email }: emails a code to the member's new address. */
export async function POST(req: AuthenticatedMedusaRequest<StoreEmailChangeCodeBody>, res: MedusaResponse) {
  const { result } = await requestEmailChangeCodeWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, email: req.validatedBody.email },
  })
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ sent: true, resend_after: result.resend_after })
}
