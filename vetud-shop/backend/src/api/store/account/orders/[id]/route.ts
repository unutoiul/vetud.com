import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listCustomerOrdersWorkflow } from "../../../../../workflows/list-customer-orders"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await listCustomerOrdersWorkflow(req.scope).run({ input: {
    customer_id: req.auth_context.actor_id,
    order_id: req.params.id,
    offset: 0,
    limit: 1,
  } })
  res.setHeader("Cache-Control", "private, no-store")
  const order = result.orders[0]
  if (!order) {
    res.status(404).json({ type: "not_found", message: "Order not found in your account." })
    return
  }
  res.json({ order })
}
