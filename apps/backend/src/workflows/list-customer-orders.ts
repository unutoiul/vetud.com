import type { MedusaContainer, OrderDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { getOrdersListWorkflow } from "@medusajs/medusa/core-flows"
import { customerOrderQuery, publicCustomerOrder, type CustomerOrdersInput } from "../lib/customer-orders"
import { customerPaymentSummary, type CustomerPaymentReference } from "../lib/customer-payment-summary"
import { NMI_PROVIDER_ID } from "../lib/nmi-settlement"
import { getPaygateConfig, isPaygate } from "../lib/paygate-config"
import { readPaygate } from "../lib/paygate-state"

type CustomerOrderRecord = OrderDTO & { payment_collections?: { payments?: CustomerPaymentReference[]; payment_sessions?: CustomerPaymentReference[] }[] }

/** Only called with the result of the customer-scoped, non-draft order query. */
export async function projectCustomerOrders(orders: CustomerOrderRecord[], container: MedusaContainer) {
  const references = (order: CustomerOrderRecord): CustomerPaymentReference[] =>
    order.payment_collections?.flatMap((collection) => [...(collection.payments ?? []), ...(collection.payment_sessions ?? []).filter(session => isPaygate(session.provider_id))]).map(({ id, provider_id }) => ({ id, provider_id })) ?? []
  const ids = [...new Set(orders.flatMap(references).filter((payment) => payment.provider_id === NMI_PROVIDER_ID).map(({ id }) => id))]
  const payments = ids.length ? await container.resolve(Modules.PAYMENT).listPayments(
    { id: ids }, { relations: ["payment_session"], take: ids.length }
  ) : []
  return Promise.all(orders.map(async order => {
    const summary = customerPaymentSummary(references(order), payments)
    const sessions = order.payment_collections?.flatMap(collection => collection.payment_sessions ?? []).filter(session => isPaygate(session.provider_id)) ?? []
    for (const reference of sessions) {
      try {
        const session = await container.resolve(Modules.PAYMENT).retrievePaymentSession(reference.id)
        const state = readPaygate(session.data, getPaygateConfig().secret)
        if (state.review) summary.review = "requires_review"
        if (state.canceled) summary.review = "canceled"
        if (!state.settled && !state.canceled && !state.review && !state.receipts.length && session.status === "pending_authorization" && order.status !== "canceled") {
          const url = new URL(`/paygate/checkout/${encodeURIComponent(session.id)}`, getPaygateConfig().callbackUrl)
          url.searchParams.set("token", state.redirect_token)
          summary.checkout_url = url.href
        }
      } catch { summary.review = "requires_review" }
    }
    return { ...publicCustomerOrder(order), payment_summary: summary }
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
