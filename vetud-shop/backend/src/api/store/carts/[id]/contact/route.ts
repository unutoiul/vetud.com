import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers"
import { setCheckoutEmailWorkflow } from "../../../../../workflows/set-checkout-email"
import type { StoreSetCheckoutEmailBody } from "./validators"

/**
 * The guest checkout's Contact step: saves the email for the order confirmation, unless a member
 * account uses it. Then it answers `{ account_exists: true }` and saves nothing, so the storefront
 * can ask the shopper to sign in. Otherwise it returns the cart like Medusa's own cart routes.
 */
export async function POST(req: AuthenticatedMedusaRequest<StoreSetCheckoutEmailBody>, res: MedusaResponse) {
  const { result } = await setCheckoutEmailWorkflow(req.scope).run({
    input: { cart_id: req.params.id, email: req.validatedBody.email, customer_id: req.auth_context?.actor_id },
  })
  res.setHeader("Cache-Control", "private, no-store")
  if (result.account_exists) {
    res.json({ account_exists: true })
    return
  }
  const cart = await refetchCart(req.params.id, req.scope, req.queryConfig.fields)
  res.json({ account_exists: false, cart })
}
