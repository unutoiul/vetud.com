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

/**
 * Emails the customer their order confirmation with manual-payment instructions,
 * and alerts the store owner that a new order is awaiting payment.
 */
export const sendOrderPlacedNotificationsWorkflow = createWorkflow(
  "send-order-placed-notifications",
  ({ id }: WorkflowInput) => {
    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: ORDER_EMAIL_FIELDS,
      filters: { id },
      options: { throwIfKeyNotFound: true },
    })

    const notifications = transform({ orders }, ({ orders }) => {
      const order = toPlain(orders[0])
      const settings = emailSettings()
      const data = {
        order,
        storefront_url: settings.storefrontUrl,
        payment_instructions: settings.paymentInstructions,
        bank_details: settings.bankDetails,
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
