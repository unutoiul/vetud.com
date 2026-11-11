import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { maskEmail } from "../../../lib/sign-in-code"
import { sendSignInCodeWorkflow } from "../../../workflows/sign-in-code"

/**
 * POST /store/sign-in-code: emails a 6-digit code to the member who just passed the password step.
 * Their token comes from the sign-in response and has no member attached until the code is checked
 * at POST /auth/mfa/challenges/:id/verify with `{ method: "email", code }`.
 */
export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const { result } = await sendSignInCodeWorkflow(req.scope).run({ input: { auth_identity_id: req.auth_context.auth_identity_id } })
  res.json({ sent_to: maskEmail(result.email) })
}
