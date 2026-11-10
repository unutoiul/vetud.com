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

type PaymentRow = {
  id: string
  refunds?: ({ id: string; amount: number | string; created_at: string | Date } | null)[] | null
  payment_collection?: { order?: { id: string } | null } | null
}

/** Emails the customer the amount of the refund that was just issued on a payment. */
export const sendRefundNotificationWorkflow = createWorkflow(
  "send-refund-notification",
  ({ id }: WorkflowInput) => {
    const { data: payments } = useQueryGraphStep({
      entity: "payment",
      fields: ["id", "refunds.id", "refunds.amount", "refunds.created_at", "payment_collection.order.id"],
      filters: { id },
    }).config({ name: "get-payment" })

    const orderId = transform({ payments }, ({ payments }) => {
      return (payments[0] as PaymentRow | undefined)?.payment_collection?.order?.id ?? ""
    })

    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ORDER_EMAIL_FIELDS,
      filters: { id: orderId },
    }).config({ name: "get-order" })

    const notifications = transform({ payments, orders }, ({ payments, orders }) => {
      const payment = payments[0] ? toPlain(payments[0] as PaymentRow) : null
      const order = orders[0] ? toPlain(orders[0]) : null
      // The event carries only the payment; the newest refund is the one just issued.
      const refund = (payment?.refunds ?? [])
        .filter((row) => row !== null)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
      if (!refund || !order?.email) {
        return [] as CreateNotificationDTO[]
      }

      const notification: CreateNotificationDTO = {
        to: order.email,
        channel: "email",
        template: EmailTemplates.REFUND_ISSUED,
        data: { order, storefront_url: emailSettings().storefrontUrl, amount: refund.amount },
        trigger_type: "payment.refunded",
        resource_id: order.id,
        resource_type: "order",
      }

      return [notification]
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
