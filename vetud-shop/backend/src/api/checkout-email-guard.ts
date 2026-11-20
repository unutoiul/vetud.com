import type { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { MEMBER_EMAIL_MESSAGE, isAnotherMembersEmail, memberIdsForEmail } from "../lib/checkout-email"

/**
 * Medusa's own cart update can set an email too, and for a member's email it would link the cart
 * to that member (whose cart then needs them signed in). The storefront uses /store/carts/:id/contact,
 * which keeps the cart on a guest record; this refuses the direct route for another member's email.
 */
export async function refuseMemberEmail(req: AuthenticatedMedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const email = (req.body as { email?: unknown } | undefined)?.email
    if (typeof email === "string" && email.trim()) {
      const memberIds = await memberIdsForEmail(req.scope.resolve(ContainerRegistrationKeys.QUERY), email)
      if (isAnotherMembersEmail(memberIds, req.auth_context?.actor_id)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, MEMBER_EMAIL_MESSAGE)
    }
    next()
  } catch (error) {
    next(error)
  }
}

// Spread into defineMiddlewares({ routes: [...] }).
export const checkoutEmailGuardRoutes: MiddlewareRoute[] = [
  {
    matcher: "/store/carts/:id",
    method: ["POST"],
    middlewares: [authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }), refuseMemberEmail],
  },
]
