import type { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"

/** Checkout stores a delivery address only. Ignore legacy clients' separate billing data. */
export function stripCartBilling(req: MedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  for (const value of [req.body, req.validatedBody]) {
    if (value && typeof value === "object" && !Array.isArray(value)) delete (value as Record<string, unknown>).billing_address
  }
  next()
}

export const cartBillingRoutes: MiddlewareRoute[] = [
  { method: ["POST"], matcher: "/store/carts", middlewares: [stripCartBilling] },
  { method: ["POST"], matcher: "/store/carts/:id", middlewares: [stripCartBilling] },
]
