import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { requestSignInCodeWorkflow } from "../../../workflows/request-sign-in-code"
import type { StoreSignInCodeBody } from "./validators"

/**
 * POST /store/sign-in-code { email }: emails a 6-digit code that signs the customer in at
 * POST /auth/customer/email-code. The same answer for every address, so it can't be used to find
 * out who has an account. `sent` is false when a code went out less than 30 seconds ago (the earlier
 * one still works); `resend_after` is the wait, in seconds, before another code can be sent.
 */
export async function POST(req: MedusaRequest<StoreSignInCodeBody>, res: MedusaResponse) {
  const { result } = await requestSignInCodeWorkflow(req.scope).run({ input: { email: req.validatedBody.email } })
  res.json(result)
}
