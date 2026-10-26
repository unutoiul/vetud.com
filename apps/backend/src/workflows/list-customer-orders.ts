import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows"
import { customerOrderQuery, publicCustomerOrder, type CustomerOrdersInput } from "../lib/customer-orders"

const customerOrderQueryStep = createStep("customer-order-query", async (input: CustomerOrdersInput) => {
  return new StepResponse(customerOrderQuery(input))
})

export const listCustomerOrdersWorkflow = createWorkflow("list-customer-orders", (input: CustomerOrdersInput) => {
  const query = customerOrderQueryStep(input)
  const result = getOrdersListWorkflow.runAsStep({ input: query })
  const response = transform({ result, input }, ({ result, input }) => {
    // Pagination always returns rows + metadata. Retain a safe empty fallback.
    const orders = Array.isArray(result) ? result : result.rows
    return {
      orders: orders.map(publicCustomerOrder),
      count: Array.isArray(result) ? result.length : result.metadata.count,
      offset: input.offset,
      limit: input.limit,
    }
  })
  return new WorkflowResponse(response)
})
