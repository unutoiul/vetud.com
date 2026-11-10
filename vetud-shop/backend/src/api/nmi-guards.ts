import type { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { NMI_WEBHOOK_PROVIDER } from "../lib/nmi-settlement"
import { guardNmiPaymentWorkflow } from "../workflows/nmi-payment-guards"
import { validateNmiWebhookWorkflow } from "../workflows/nmi-reconcile-payment"

export function nmiOrderGuard(action: "fulfillment" | "shipment") {
  return async (req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) => {
    try {
      await guardNmiPaymentWorkflow(req.scope).run({ input: { action, order_id: req.params.id } })
      next()
    } catch (error) { next(error) }
  }
}

export async function nmiCaptureGuard(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const body = (req.validatedBody ?? req.body) as { amount?: unknown } | undefined
    await guardNmiPaymentWorkflow(req.scope).run({ input: { action: "capture", payment_id: req.params.id, amount: body?.amount } })
    next()
  } catch (error) { next(error) }
}

export async function nmiWebhookGuard(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    await validateNmiWebhookWorkflow(req.scope).run({
      input: {
        provider: NMI_WEBHOOK_PROVIDER,
        payload: { rawData: req.rawBody, headers: req.headers },
      },
    })
    next()
  } catch (error) { next(error) }
}

// Spread these into the existing defineMiddlewares({ routes: [...] }). Medusa
// 2.21 exposes only POST-effect fulfillmentCreated/shipmentCreated hooks, so
// admin middleware is the supported pre-effect gate. Native route auth remains.
export const nmiGuardRoutes: MiddlewareRoute[] = [
  {
    matcher: "/admin/orders/:id/fulfillments",
    method: ["POST"],
    middlewares: [nmiOrderGuard("fulfillment")],
  },
  {
    matcher: "/admin/orders/:id/fulfillments/:fulfillment_id/shipments",
    method: ["POST"],
    middlewares: [nmiOrderGuard("shipment")],
  },
  {
    matcher: "/admin/payments/:id/capture",
    method: ["POST"],
    middlewares: [nmiCaptureGuard],
  },
  {
    matcher: `/hooks/payment/${NMI_WEBHOOK_PROVIDER}`,
    method: ["POST"],
    bodyParser: { preserveRawBody: true },
    middlewares: [nmiWebhookGuard],
  },
]
