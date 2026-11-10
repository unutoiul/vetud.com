import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { transferCartCustomerWorkflow } from "@medusajs/medusa/core-flows"
import { validateCartOwnership } from "../../lib/cart-ownership"

// Native cart transfer permits changing any cart's customer. Allow guest carts
// and the same account, but never take over another registered shopper's cart
// or assume a linked customer is a guest when its account flag is missing.
transferCartCustomerWorkflow.hooks.validate(async ({ cart, input }) => {
  validateCartOwnership(cart, input.customer_id)
  return new StepResponse()
})
