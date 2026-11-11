import type { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate, validateAndTransformBody } from "@medusajs/framework/http"
import { StoreChangeEmailSchema, StoreChangePasswordSchema } from "./store/account/validators"

const customer = authenticate("customer", ["session", "bearer"])

/** The signed-in member's own sign-in details (account page). */
export const accountRoutes: MiddlewareRoute[] = [
  { method: ["POST"], matcher: "/store/account/password", middlewares: [customer, validateAndTransformBody(StoreChangePasswordSchema)] },
  { method: ["POST"], matcher: "/store/account/email", middlewares: [customer, validateAndTransformBody(StoreChangeEmailSchema)] },
]
