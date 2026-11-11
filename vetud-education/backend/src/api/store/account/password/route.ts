import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { changeCustomerPasswordWorkflow } from "../../../../workflows/account"
import type { StoreChangePasswordBody } from "../validators"

/** Changes the signed-in member's password. The current password is required. */
export async function POST(req: AuthenticatedMedusaRequest<StoreChangePasswordBody>, res: MedusaResponse) {
  await changeCustomerPasswordWorkflow(req.scope).run({
    input: { customer_id: req.auth_context.actor_id, ...req.validatedBody },
  })
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ changed: true })
}
