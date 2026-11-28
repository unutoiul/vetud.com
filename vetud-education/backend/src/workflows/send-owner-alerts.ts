import type { CreateNotificationDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import type { EmailListConfirmedEvent } from "../lib/email-list"
import { emailSettings } from "../lib/notifications"
import { EMAIL_LIST_MODULE } from "../modules/email-list"
import type EmailListModuleService from "../modules/email-list/service"
import type { EmailListSignupAlertData } from "../modules/resend/owner-alerts"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

/** The owner alert for a confirmed sign-up, with the list's size. Nothing when STORE_OWNER_EMAIL isn't set. */
const buildEmailListSignupAlertStep = createStep(
  "build-email-list-signup-alert",
  async (input: EmailListConfirmedEvent, { container }) => {
    const { ownerEmail } = emailSettings()
    if (!ownerEmail) return new StepResponse([] as CreateNotificationDTO[])
    const service = container.resolve<EmailListModuleService>(EMAIL_LIST_MODULE)
    const [, confirmedCount] = await service.listAndCountEmailSubscribers(
      { status: "confirmed" },
      { select: ["id"], take: 1 },
    )
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: members } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email: input.email, has_account: true },
    })
    const data: EmailListSignupAlertData = {
      email: input.email,
      locale: input.locale,
      consented_at: input.consented_at,
      confirmed_at: input.confirmed_at,
      is_member: members.length > 0,
      confirmed_count: confirmedCount,
    }
    const notification: CreateNotificationDTO = {
      to: ownerEmail,
      channel: "email",
      template: EmailTemplates.EMAIL_LIST_SIGNUP_ADMIN,
      data,
      trigger_type: "email_list.confirmed",
      resource_id: input.id,
      resource_type: "email_subscriber",
      idempotency_key: `email-list-signup-alert:${input.id}:${input.confirmed_at}`,
    }
    return new StepResponse([notification])
  },
)

/** Emails the owner when someone confirms their email-list sign-up. */
export const sendEmailListSignupAlertWorkflow = createWorkflow(
  "send-email-list-signup-alert",
  function (input: EmailListConfirmedEvent) {
    const notifications = buildEmailListSignupAlertStep(input)
    return new WorkflowResponse(sendNotificationStep(notifications))
  },
)
