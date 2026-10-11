import type { CreateNotificationDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emailSettings } from "../lib/notifications"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

export type SendContactMessageInput = {
  name: string
  email: string
  subject?: string
  order_number?: string
  message: string
}

const buildContactNotificationStep = createStep(
  "build-contact-notification",
  async (input: SendContactMessageInput) => {
    const { ownerEmail } = emailSettings()
    if (!ownerEmail) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The contact form is not configured. Set STORE_OWNER_EMAIL on the server."
      )
    }

    const notification: CreateNotificationDTO = {
      to: ownerEmail,
      channel: "email",
      template: EmailTemplates.CONTACT_MESSAGE,
      data: { ...input },
      trigger_type: "contact.submitted",
    }

    return new StepResponse([notification])
  }
)

/** Forwards a storefront contact-form message to the store owner's inbox. */
export const sendContactMessageWorkflow = createWorkflow(
  "send-contact-message",
  (input: SendContactMessageInput) => {
    const notifications = buildContactNotificationStep(input)
    sendNotificationStep(notifications)

    return new WorkflowResponse({ success: true })
  }
)
