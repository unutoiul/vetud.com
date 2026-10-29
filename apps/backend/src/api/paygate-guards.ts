import type { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { isPaygate } from "../lib/paygate-config"
import { Modules } from "@medusajs/framework/utils"
import { guardPaygateFulfillmentWorkflow, preparePaygateWorkflow } from "../workflows/paygate"

export async function preparePaygateSession(req: AuthenticatedMedusaRequest<{ provider_id: string; data?: unknown }>, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const creating = isPaygate(req.body.provider_id)
    if (!creating) {
      const collection = await req.scope.resolve(Modules.PAYMENT).retrievePaymentCollection(req.params.id, { relations: ["payment_sessions"] })
      if (!collection.payment_sessions?.some(session => isPaygate(session.provider_id))) return next()
    }
    // Also protect an existing PayGate reservation when a caller tries to switch
    // providers after placing it. Before placement, ordinary method changes work.
    const { result } = await preparePaygateWorkflow(req.scope).run({ input: { payment_collection_id: req.params.id, customer_id: req.auth_context?.actor_id, data: creating ? req.body.data : undefined } })
    if (creating) {
      req.body.data = result
      req.validatedBody = req.body
    }
    next()
  } catch (error) { next(error) }
}

async function fulfillmentGuard(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    await guardPaygateFulfillmentWorkflow(req.scope).run({ input: { order_id: req.params.id } })
    next()
  } catch (error) { next(error) }
}

export const paygateGuardRoutes: MiddlewareRoute[] = [
  { matcher: "/admin/orders/:id/fulfillments", method: ["POST"], middlewares: [fulfillmentGuard] },
  { matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/shipments", method: ["POST"], middlewares: [fulfillmentGuard] },
]
