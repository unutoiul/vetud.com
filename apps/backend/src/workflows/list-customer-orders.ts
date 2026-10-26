import type { MedusaContainer, OrderDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows"
import { customerOrderQuery, publicCustomerOrder, type CustomerOrdersInput } from "../lib/customer-orders"
import { customerPaymentSummary, type CustomerPaymentReference } from "../lib/customer-payment-summary"
import { NMI_PROVIDER_ID } from "../lib/nmi-settlement"

type CustomerOrderRecord = OrderDTO & { payment_collections?: { payments?: CustomerPaymentReference[] }[] }

/** Only called with the result of the customer-scoped, non-draft order query. */
export async function projectCustomerOrders(orders: CustomerOrderRecord[], container: MedusaContainer) {
  const references = (order: CustomerOrderRecord): CustomerPaymentReference[] =>
    order.payment_collections?.flatMap((collection) => collection.payments ?? []).map(({ id, provider_id }) => ({ id, provider_id })) ?? []
  const ids = [...new Set(orders.flatMap(references).filter((payment) => payment.provider_id === NMI_PROVIDER_ID).map(({ id }) => id))]
  const payments = ids.length ? await container.resolve(Modules.PAYMENT).listPayments(
    { id: ids }, { relations: ["payment_session"], take: ids.length }
  ) : []
  return orders.map((order) => ({
    ...publicCustomerOrder(order),
    payment_summary: customerPaymentSummary(references(order), payments),
  }))
}

const projectCustomerOrdersStep = createStep("project-customer-orders", async (input: {
  orders: OrderDTO[]; count: number; offset: number; limit: number
}, { container }) => {
  return new StepResponse({ ...input, orders: await projectCustomerOrders(input.orders, container) })
})

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
      orders,
      count: Array.isArray(result) ? result.length : result.metadata.count,
      offset: input.offset,
      limit: input.limit,
    }
  })
  return new WorkflowResponse(projectCustomerOrdersStep(response))
})
