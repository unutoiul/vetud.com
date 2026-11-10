import type { CreateNotificationDTO } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { emailSettings } from "../lib/notifications"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

type WorkflowInput = { id: string }

type CustomerRow = { id: string; email?: string | null; first_name?: string | null; has_account?: boolean | null }

/** Welcomes a customer who registered an account (not customers created by an admin). */
export const sendCustomerWelcomeWorkflow = createWorkflow(
  "send-customer-welcome",
  ({ id }: WorkflowInput) => {
    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "email", "first_name", "has_account"],
      filters: { id },
    })

    const notifications = transform({ customers }, ({ customers }) => {
      const customer = customers[0] as CustomerRow | undefined
      if (!customer?.email || !customer.has_account) {
        return [] as CreateNotificationDTO[]
      }

      const notification: CreateNotificationDTO = {
        to: customer.email,
        channel: "email",
        template: EmailTemplates.CUSTOMER_WELCOME,
        data: { first_name: customer.first_name, storefront_url: emailSettings().storefrontUrl },
        trigger_type: "customer.created",
        resource_id: customer.id,
        resource_type: "customer",
      }

      return [notification]
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
