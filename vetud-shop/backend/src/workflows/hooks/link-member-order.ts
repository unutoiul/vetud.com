import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"
import { memberIdsForEmail } from "../../lib/checkout-email"

type LinkedOrder = { order_id: string; previous_customer_id: string | null }

type OrderCreatedHook = (
  handler: (
    input: { order_id: string; cart_id: string },
    context: { container: MedusaContainer },
  ) => Promise<StepResponse<LinkedOrder | null, LinkedOrder | null>>,
  compensate: (change: LinkedOrder | null, context: { container: MedusaContainer }) => Promise<void>,
) => void

// Medusa runs `orderCreated` once the order exists, for every payment method, but its types only
// list the `validate` hook.
const { orderCreated } = completeCartWorkflow.hooks as unknown as { orderCreated: OrderCreatedHook }

/**
 * The email is all a shopper needs to order (owner, 2026-11-20). An order placed without signing in,
 * with the email of a member account, is filed in that account, so the member sees it the next time
 * they sign in. A failure here is only logged: it must never stop an order.
 */
orderCreated(
  async ({ order_id }, { container }) => {
    try {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data } = await query.graph({
        entity: "order",
        fields: ["id", "email", "customer_id", "customer.has_account"],
        filters: { id: order_id },
      })
      const order = data[0] as
        | {
            id: string
            email?: string | null
            customer_id?: string | null
            customer?: { has_account?: boolean | null } | null
          }
        | undefined
      // Only guest orders: a signed-in member's order already sits in their account.
      if (!order?.email || order.customer?.has_account !== false) return new StepResponse(null, null)
      const members = await memberIdsForEmail(query, order.email)
      if (members.length !== 1) return new StepResponse(null, null)
      await container.resolve(Modules.ORDER).updateOrders(order.id, { customer_id: members[0] })
      const change: LinkedOrder = { order_id: order.id, previous_customer_id: order.customer_id ?? null }
      return new StepResponse(change, change)
    } catch (error) {
      container
        .resolve(ContainerRegistrationKeys.LOGGER)
        .warn(`Couldn't file order ${order_id} in the member's account: ${(error as Error).message}`)
      return new StepResponse(null, null)
    }
  },
  async (change, { container }) => {
    if (!change?.previous_customer_id) return
    await container.resolve(Modules.ORDER).updateOrders(change.order_id, { customer_id: change.previous_customer_id })
  },
)
