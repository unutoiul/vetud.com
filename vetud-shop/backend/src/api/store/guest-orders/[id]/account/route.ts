import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { AuthenticationInput } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { attachGuestOrderWorkflow, findGuestOrderWorkflow } from "../../../../../workflows/guest-order-account"
import type { StoreGuestOrderAccountBody } from "./validators"

/**
 * POST /store/guest-orders/:id/account: after ordering as a guest, create an account with a password
 * (or, signed in with the same email, add the order to that account). The proof that this browser
 * placed the order is the order's cart id, which only the checkout knows; it works for 24 hours.
 */
export async function POST(req: AuthenticatedMedusaRequest<StoreGuestOrderAccountBody>, res: MedusaResponse) {
  const { cart_id, password } = req.validatedBody
  const input = { order_id: req.params.id, cart_id, customer_id: req.auth_context?.actor_id || undefined }
  const { result: order } = await findGuestOrderWorkflow(req.scope).run({ input })

  // A new login is made the way Medusa's own sign-up route does, so the password never enters a workflow.
  let authIdentityId: string | undefined
  if (!order.target_customer_id) {
    if (!password) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Choose a password of at least 8 characters.")
    const auth = req.scope.resolve(Modules.AUTH)
    const authData: AuthenticationInput = { url: req.url, headers: req.headers as AuthenticationInput["headers"], query: {}, body: { email: order.email, password }, protocol: req.protocol }
    const { success, authIdentity, error } = await auth.register("emailpass", authData)
    if (!success || !authIdentity) throw new MedusaError(MedusaError.Types.INVALID_DATA, error || "We couldn't create your account. Please try again.")
    authIdentityId = authIdentity.id
  }

  try {
    const { result } = await attachGuestOrderWorkflow(req.scope).run({ input: { ...input, auth_identity_id: authIdentityId } })
    res.json(result)
  } catch (error) {
    if (authIdentityId) await req.scope.resolve(Modules.AUTH).deleteAuthIdentities([authIdentityId]).catch(() => undefined)
    throw error
  }
}
