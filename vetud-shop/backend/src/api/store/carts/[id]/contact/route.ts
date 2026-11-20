import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers"
import { setCheckoutEmailWorkflow } from "../../../../../workflows/set-checkout-email"
import type { StoreSetCheckoutEmailBody } from "./validators"

/**
 * The guest checkout's Contact step: saves the email for the order confirmation. Any email works,
 * including one a member account uses (the order is then filed in that account). Returns the cart
 * like Medusa's own cart routes; `account_exists` is always false and kept for older storefronts.
 */
export async function POST(req: AuthenticatedMedusaRequest<StoreSetCheckoutEmailBody>, res: MedusaResponse) {
  const { result } = await setCheckoutEmailWorkflow(req.scope).run({
    input: { cart_id: req.params.id, email: req.validatedBody.email, customer_id: req.auth_context?.actor_id },
  })
  res.setHeader("Cache-Control", "private, no-store")
  const cart = await refetchCart(req.params.id, req.scope, req.queryConfig.fields)
  res.json({ ...result, cart })
}
