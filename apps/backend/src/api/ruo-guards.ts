import type { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { validateResearchProfile, type CartForResearchCheck } from "../lib/research-profile"

/** Runs before a cart becomes an order: signed-in owner plus research-use acknowledgment. */
export async function requireResearchProfile(req: AuthenticatedMedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "cart",
      fields: ["id", "customer_id", "metadata"],
      filters: { id: req.params.id },
    })
    const cart = data[0] as CartForResearchCheck | undefined
    // An unknown cart is left for Medusa to report as not found.
    if (cart) validateResearchProfile(cart, req.auth_context?.actor_id)
    next()
  } catch (error) {
    next(error)
  }
}

// Spread into defineMiddlewares({ routes: [...] }). Guests are rejected by `authenticate` (401).
export const ruoGuardRoutes: MiddlewareRoute[] = [
  {
    matcher: "/store/carts/:id/complete",
    method: ["POST"],
    middlewares: [authenticate("customer", ["session", "bearer"]), requireResearchProfile],
  },
]
