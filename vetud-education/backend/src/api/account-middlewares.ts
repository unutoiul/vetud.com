import type { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate, validateAndTransformBody } from "@medusajs/framework/http"
import { StoreChangeEmailSchema, StoreEmailChangeCodeSchema } from "./store/account/validators"

const customer = authenticate("customer", ["session", "bearer"])

/** The signed-in member's sign-in email (account page). Members have no passwords. */
export const accountRoutes: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/account/email/code",
    middlewares: [customer, validateAndTransformBody(StoreEmailChangeCodeSchema)],
  },
  {
    method: ["POST"],
    matcher: "/store/account/email",
    middlewares: [customer, validateAndTransformBody(StoreChangeEmailSchema)],
  },
]
