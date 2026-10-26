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
import { paymentNotice } from "../lib/payment-notice"

type WorkflowInput = { id: string }
const ORDER_PLACED_FIELDS = [...ORDER_EMAIL_FIELDS, "payment_collections.payments.provider_id", "payment_collections.payments.data", "payment_collections.payments.captured_at"]

/**
 * Emails payment-method-appropriate confirmation and fulfillment instructions
 * to the customer and store owner without persisting gateway payloads.
 */
export const sendOrderPlacedNotificationsWorkflow = createWorkflow(
  "send-order-placed-notifications",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ORDER_PLACED_FIELDS,
      filters: { id },
      options: { throwIfKeyNotFound: true },
    })

    const notifications = transform({ orders }, ({ orders }) => {
      // Do not persist gateway data or tokens in notification payloads.
      const { payment_collections, ...order } = toPlain(orders[0])
      const notice = paymentNotice(payment_collections)
      const settings = emailSettings()
      const data = {
        order,
        ...notice,
        storefront_url: settings.storefrontUrl,
        payment_instructions: notice.manual_payment ? settings.paymentInstructions : undefined,
        bank_details: notice.manual_payment ? settings.bankDetails : undefined,
      }
      const result: CreateNotificationDTO[] = []

      if (order.email) {
        result.push({
          to: order.email,
          channel: "email",
          template: EmailTemplates.ORDER_PLACED,
          data,
          trigger_type: "order.placed",
          resource_id: order.id,
          resource_type: "order",
        })
      }

      if (settings.ownerEmail) {
        result.push({
          to: settings.ownerEmail,
          channel: "email",
          template: EmailTemplates.ORDER_PLACED_ADMIN,
          data: { ...data, admin_url: settings.adminUrl },
          trigger_type: "order.placed",
          resource_id: order.id,
          resource_type: "order",
        })
      }

      return result
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
