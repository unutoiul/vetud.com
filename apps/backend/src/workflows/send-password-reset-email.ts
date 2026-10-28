import type { CreateNotificationDTO } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emailSettings } from "../lib/notifications"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

export type SendPasswordResetEmailInput = {
  email: string
  token: string
  actor_type: string
  /** Storefront country segment sent with the request; unvalidated client input. */
  country_code?: unknown
}

const buildPasswordResetNotificationStep = createStep(
  "build-password-reset-notification",
  async (input: SendPasswordResetEmailInput) => {
    const { storefrontUrl, adminUrl } = emailSettings()
    const query = new URLSearchParams({ token: input.token, email: input.email }).toString()
    const country =
      typeof input.country_code === "string" && /^[a-z]{2}$/.test(input.country_code)
        ? `/${input.country_code}`
        : ""
    // Admin users reset in Medusa Admin; customers on the storefront.
    const resetUrl =
      input.actor_type === "user"
        ? `${adminUrl}/app/reset-password?${query}`
        : `${storefrontUrl}${country}/account/reset-password?${query}`

    const notification: CreateNotificationDTO = {
      to: input.email,
      channel: "email",
      template: EmailTemplates.PASSWORD_RESET,
      data: { reset_url: resetUrl },
      trigger_type: "auth.password_reset",
    }

    return new StepResponse([notification])
  }
)

/** Emails a one-time password reset link to a customer or admin user. */
export const sendPasswordResetEmailWorkflow = createWorkflow(
  "send-password-reset-email",
  (input: SendPasswordResetEmailInput) => {
    const notifications = buildPasswordResetNotificationStep(input)
    sendNotificationStep(notifications)

    return new WorkflowResponse({ success: true })
  }
)
