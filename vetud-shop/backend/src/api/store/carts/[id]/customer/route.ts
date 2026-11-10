import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { transferCustomerCartWorkflow } from "../../../../../workflows/transfer-customer-cart"

// Keeps the SDK endpoint and Medusa's built-in authentication/body/field
// validation, while serializing customer ownership changes in our workflow.
export async function POST(req: AuthenticatedMedusaRequest<{ additional_data?: Record<string, unknown> }>, res: MedusaResponse) {
  const { result: cart } = await transferCustomerCartWorkflow(req.scope).run({ input: {
    cart_id: req.params.id,
    customer_id: req.auth_context.actor_id,
    fields: req.queryConfig.fields,
    additional_data: req.validatedBody.additional_data,
  } })
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ cart })
}
