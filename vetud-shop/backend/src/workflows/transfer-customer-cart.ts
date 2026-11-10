import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { transferCartCustomerWorkflow } from "@medusajs/medusa/core-flows"
import { validateCartOwnership } from "../lib/cart-ownership"

type Input = { cart_id: string; customer_id: string; fields: string[]; additional_data?: Record<string, unknown> }

export async function executeCustomerCartTransfer(input: Input, container: MedusaContainer) {
  const locking = container.resolve(Modules.LOCKING)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // This outer lock covers both the ownership check and the complete transfer.
  // The native workflow's own cart lock starts AFTER its validation hook, so a
  // hook alone cannot prevent two customers claiming the same guest cart.
  return await locking.execute(`customer-cart:${input.cart_id}`, async () => {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: ["id", "customer_id", "customer.has_account"],
      filters: { id: input.cart_id },
    }, { throwIfKeyNotFound: true })
    validateCartOwnership(carts[0], input.customer_id)
    await transferCartCustomerWorkflow(container).run({ input: {
      id: input.cart_id,
      customer_id: input.customer_id,
      additional_data: input.additional_data,
    } })
    const { data } = await query.graph({
      entity: "cart",
      fields: input.fields,
      filters: { id: input.cart_id },
    }, { throwIfKeyNotFound: true })
    return data[0]
  })
}

const transferCustomerCartStep = createStep("transfer-customer-cart", async (input: Input, { container }) => {
  return new StepResponse(await executeCustomerCartTransfer(input, container))
})

export const transferCustomerCartWorkflow = createWorkflow("transfer-customer-cart", (input: Input) => {
  const cart = transferCustomerCartStep(input)
  return new WorkflowResponse(cart)
})
