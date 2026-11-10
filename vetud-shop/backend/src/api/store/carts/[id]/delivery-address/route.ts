import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { refetchCart } from "@medusajs/medusa/api/store/carts/helpers"
import { setCartDeliveryAddressWorkflow } from "../../../../../workflows/set-cart-delivery-address"
import type { StoreSetCartDeliveryAddressBody } from "./validators"

/**
 * Sets where the order goes, for any country the store sells to, without changing the cart's
 * currency. Returns the cart like Medusa's own cart routes (same `fields` query).
 */
export async function POST(req: AuthenticatedMedusaRequest<StoreSetCartDeliveryAddressBody>, res: MedusaResponse) {
  await setCartDeliveryAddressWorkflow(req.scope).run({ input: { cart_id: req.params.id, ...req.validatedBody } })
  const cart = await refetchCart(req.params.id, req.scope, req.queryConfig.fields)
  res.setHeader("Cache-Control", "private, no-store")
  res.json({ cart })
}
