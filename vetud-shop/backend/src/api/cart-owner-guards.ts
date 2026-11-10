import type { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { validateCartOwner, type CartForOwnerCheck } from "../lib/cart-owner"

/** Runs before a cart becomes an order: only the signed-in owner may complete it. */
export async function requireCartOwner(req: AuthenticatedMedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "cart",
      fields: ["id", "customer_id"],
      filters: { id: req.params.id },
    })
    const cart = data[0] as CartForOwnerCheck | undefined
    // An unknown cart is left for Medusa to report as not found.
    if (cart) validateCartOwner(cart, req.auth_context?.actor_id)
    next()
  } catch (error) {
    next(error)
  }
}

// Spread into defineMiddlewares({ routes: [...] }). Guests are rejected by `authenticate` (401).
export const cartOwnerGuardRoutes: MiddlewareRoute[] = [
  {
    matcher: "/store/carts/:id/complete",
    method: ["POST"],
    middlewares: [authenticate("customer", ["session", "bearer"]), requireCartOwner],
  },
]
