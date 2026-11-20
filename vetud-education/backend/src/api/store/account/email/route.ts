import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { changeCustomerEmailWorkflow } from "../../../../workflows/account"
import type { StoreChangeEmailBody } from "../validators"

/**
 * POST /store/account/email { email, code }: changes the signed-in member's email, which is also the
 * address they sign in with. The code was emailed to the new address by /store/account/email/code.
 */
export async function POST(req: AuthenticatedMedusaRequest<StoreChangeEmailBody>, res: MedusaResponse) {
  const { result } = await changeCustomerEmailWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, ...req.validatedBody },
  })
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ email: result.email })
}
