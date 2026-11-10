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

type WorkflowInput = { id: string }

type Collection = { payments?: ({ captured_at?: string | Date | null } | null)[] | null } | null

const ORDER_CANCELED_FIELDS = [...ORDER_EMAIL_FIELDS, "payment_collections.payments.captured_at"]

/** Emails the customer that their order was canceled, and whether a refund follows. */
export const sendOrderCanceledNotificationWorkflow = createWorkflow(
  "send-order-canceled-notification",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ORDER_CANCELED_FIELDS,
      filters: { id },
    })

    const notifications = transform({ orders }, ({ orders }) => {
      if (!orders[0]) {
        return [] as CreateNotificationDTO[]
      }
      // Payment rows stay out of the notification payload.
      const { payment_collections, ...order } = toPlain(orders[0]) as Record<string, unknown> & {
        id: string
        email?: string | null
        payment_collections?: Collection[] | null
      }
      if (!order.email) {
        return [] as CreateNotificationDTO[]
      }
      const paid = (payment_collections ?? []).some((collection) =>
        collection?.payments?.some((payment) => Boolean(payment?.captured_at))
      )

      const notification: CreateNotificationDTO = {
        to: order.email,
        channel: "email",
        template: EmailTemplates.ORDER_CANCELED,
        data: { order, storefront_url: emailSettings().storefrontUrl, paid },
        trigger_type: "order.canceled",
        resource_id: order.id,
        resource_type: "order",
      }

      return [notification]
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
