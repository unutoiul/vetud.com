import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { validateNmiCart } from "../../lib/nmi-cart"

completeCartWorkflow.hooks.validate(async ({ cart }) => {
  validateNmiCart(cart)
  return new StepResponse()
})
