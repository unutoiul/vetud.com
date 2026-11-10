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

type WorkflowInput = { fulfillment_id: string }

type FulfillmentRow = { id: string; order?: { id: string } | null }

/** Emails the customer that a fulfillment was marked as delivered in Admin. */
export const sendDeliveryNotificationWorkflow = createWorkflow(
  "send-delivery-notification",
  ({ fulfillment_id }: WorkflowInput) => {
    const { data: fulfillments } = useQueryGraphStep({
      entity: "fulfillment",
      fields: ["id", "order.id"],
      filters: { id: fulfillment_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-fulfillment" })

    const orderId = transform({ fulfillments }, ({ fulfillments }) => {
      return (fulfillments[0] as FulfillmentRow).order?.id ?? ""
    })

    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ORDER_EMAIL_FIELDS,
      filters: { id: orderId },
    }).config({ name: "get-order" })

    const notifications = transform({ orders }, ({ orders }) => {
      const order = orders[0] ? toPlain(orders[0]) : null
      if (!order?.email) {
        return [] as CreateNotificationDTO[]
      }

      const notification: CreateNotificationDTO = {
        to: order.email,
        channel: "email",
        template: EmailTemplates.ORDER_DELIVERED,
        data: { order, storefront_url: emailSettings().storefrontUrl },
        trigger_type: "delivery.created",
        resource_id: order.id,
        resource_type: "order",
      }

      return [notification]
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
