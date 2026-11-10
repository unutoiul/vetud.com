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

type WorkflowInput = { id: string; trigger: string }

type InviteRow = { id: string; email: string; token: string; expires_at?: string | Date | null; accepted?: boolean | null }

/** Emails a Medusa Admin invitation link (new and resent invites). */
export const sendUserInviteWorkflow = createWorkflow(
  "send-user-invite",
  ({ id, trigger }: WorkflowInput) => {
    const { data: invites } = useQueryGraphStep({
      entity: "invite",
      fields: ["id", "email", "token", "expires_at", "accepted"],
      filters: { id },
    })

    const notifications = transform({ invites, trigger }, ({ invites, trigger }) => {
      const invite = invites[0] as InviteRow | undefined
      if (!invite?.email || !invite.token || invite.accepted) {
        return [] as CreateNotificationDTO[]
      }

      const notification: CreateNotificationDTO = {
        to: invite.email,
        channel: "email",
        template: EmailTemplates.USER_INVITE,
        data: {
          invite_url: `${emailSettings().adminUrl}/app/invite?token=${encodeURIComponent(invite.token)}`,
          expires_at: invite.expires_at ? new Date(invite.expires_at).toISOString() : null,
        },
        trigger_type: trigger,
        resource_id: invite.id,
        resource_type: "invite",
      }

      return [notification]
    })

    const sent = sendNotificationStep(notifications)

    return new WorkflowResponse(sent)
  }
)
