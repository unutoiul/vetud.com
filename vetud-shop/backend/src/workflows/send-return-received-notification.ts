import type { CreateNotificationDTO } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { emailSettings, ORDER_EMAIL_FIELDS, toPlain } from "../lib/notifications"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

type WorkflowInput = { order_id: string; return_id: string }

type ReturnRow = {
  id: string
  refund_amount?: number | string | null
  items?: ({
    quantity: number | string
    received_quantity?: number | string | null
    item?: { title?: string | null; product_title?: string | null; variant_title?: string | null } | null
  } | null)[] | null
}

/** Emails the customer that their returned items arrived and were checked in. */
export const sendReturnReceivedNotificationWorkflow = createWorkflow(
  "send-return-received-notification",
  ({ order_id, return_id }: WorkflowInput) => {
    const { data: returns } = useQueryGraphStep({
      entity: "return",
      fields: [
        "id",
        "refund_amount",
        "items.quantity",
        "items.received_quantity",
        "items.item.title",
        "items.item.product_title",
        "items.item.variant_title",
      ],
      filters: { id: return_id },
    }).config({ name: "get-return" })

    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ORDER_EMAIL_FIELDS,
      filters: { id: order_id },
    }).config({ name: "get-order" })

    const notifications = transform({ returns, orders }, ({ returns, orders }) => {
      const orderReturn = returns[0] ? toPlain(returns[0] as ReturnRow) : null
      const order = orders[0] ? toPlain(orders[0]) : null
      if (!orderReturn || !order?.email) {
        return [] as CreateNotificationDTO[]
      }

      const items = (orderReturn.items ?? [])
        .filter((row) => row !== null)
        .map((row) => ({
          title: [row.item?.product_title ?? row.item?.title, row.item?.variant_title].filter(Boolean).join(" · ") || "Item",
          quantity: Number(row.received_quantity) || row.quantity,
        }))

      const notification: CreateNotificationDTO = {
        to: order.email,
        channel: "email",
        template: EmailTemplates.RETURN_RECEIVED,
        data: {
          order,
          storefront_url: emailSettings().storefrontUrl,
          items,
          refund_amount: orderReturn.refund_amount,
        },
        trigger_type: "order.return_received",
        resource_id: order.id,
        resource_type: "order",
      }

      return [notification]
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
