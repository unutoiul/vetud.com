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
  amount: number | string
  provider_id: string
  payment_collection?: { order?: { id: string } | null } | null
}

/**
 * Tells the customer their payment arrived: an Admin capture of a bank transfer, a card capture
 * or a verified settlement. Captures made while the cart is completed have no order yet and are
 * skipped, because the order confirmation already covers them.
 */
export const sendPaymentReceivedWorkflow = createWorkflow(
  "send-payment-received",
  ({ id }: WorkflowInput) => {
    const { data: payments } = useQueryGraphStep({
      entity: "payment",
      fields: ["id", "amount", "provider_id", "payment_collection.order.id"],
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
      if (!payment || !order?.email) {
        return [] as CreateNotificationDTO[]
      }

      const notification: CreateNotificationDTO = {
        to: order.email,
        channel: "email",
        template: EmailTemplates.PAYMENT_RECEIVED,
        data: {
          order,
          storefront_url: emailSettings().storefrontUrl,
          amount: payment.amount,
          manual_payment: payment.provider_id === "pp_system_default",
        },
        trigger_type: "payment.captured",
        resource_id: order.id,
        resource_type: "order",
      }

      return [notification]
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
