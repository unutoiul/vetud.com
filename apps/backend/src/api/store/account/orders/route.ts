import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listCustomerOrdersWorkflow } from "../../../../workflows/list-customer-orders"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const { result } = await listCustomerOrdersWorkflow(req.scope).run({
    input: {
      // Never accept customer identity or an email address from query parameters.
      customer_id: req.auth_context.actor_id,
      offset: req.queryConfig.pagination.skip ?? 0,
      limit: req.queryConfig.pagination.take ?? 10,
    },
  })

  res.setHeader("Cache-Control", "private, no-store")
  res.json(result)
}
