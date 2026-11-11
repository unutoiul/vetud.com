import type { MedusaNextFunction, MedusaRequest, MedusaResponse, MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/framework/http"
import { SIGN_IN_CODE_METHOD } from "../lib/sign-in-code"
import { enableSignInCodeWorkflow } from "../workflows/sign-in-code"

/**
 * Every member sign-in asks for an emailed code. This runs before Medusa checks the password, so
 * the answer is an MFA challenge instead of a token. If it fails, the sign-in fails too, so a
 * fault can never skip the code.
 */
async function requireSignInCode(req: MedusaRequest<{ email?: unknown }>, _res: MedusaResponse, next: MedusaNextFunction) {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email : ""
    if (email) await enableSignInCodeWorkflow(req.scope).run({ input: { email } })
    next()
  } catch (error) {
    next(error)
  }
}

/** The email method is set up by this backend only, never through Medusa's generic MFA setup route. */
function blockEmailFactorSetup(req: MedusaRequest<{ provider?: unknown }>, res: MedusaResponse, next: MedusaNextFunction) {
  if (req.body?.provider === SIGN_IN_CODE_METHOD) {
    res.status(403).json({ type: "not_allowed", message: "Email sign-in codes are managed by VETUD." })
    return
  }
  next()
}

export const signInCodeRoutes: MiddlewareRoute[] = [
  { method: ["POST"], matcher: "/auth/customer/emailpass", middlewares: [requireSignInCode] },
  // The token from the password step has no member yet and an unfinished MFA challenge, so both checks are relaxed here only.
  { method: ["POST"], matcher: "/store/sign-in-code", middlewares: [authenticate("customer", ["bearer"], { allowUnregistered: true, requireMfa: false })] },
  { method: ["POST"], matcher: "/auth/mfa/factors", middlewares: [blockEmailFactorSetup] },
]
