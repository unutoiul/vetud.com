import type { AuthenticatedMedusaRequest, MedusaNextFunction, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { ACCOUNT_EXISTS_MESSAGE, emailNeedsSignIn, memberIdsForEmail } from "../lib/checkout-email"

/**
 * Medusa's own cart update can set an email too. The storefront uses /store/carts/:id/contact,
 * which answers with a sign-in prompt; this keeps a direct call from putting a member's email on
 * a cart the member hasn't signed in to.
 */
export async function refuseMemberEmail(req: AuthenticatedMedusaRequest, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const email = (req.body as { email?: unknown } | undefined)?.email
    if (typeof email === "string" && email.trim()) {
      const memberIds = await memberIdsForEmail(req.scope.resolve(ContainerRegistrationKeys.QUERY), email)
      if (emailNeedsSignIn(memberIds, req.auth_context?.actor_id)) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, ACCOUNT_EXISTS_MESSAGE)
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
