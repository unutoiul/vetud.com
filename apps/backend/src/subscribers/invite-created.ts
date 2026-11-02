import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendUserInviteWorkflow } from "../workflows/send-user-invite"

export default async function inviteCreatedHandler({
  event: { name, data },
  container,
}: SubscriberArgs<{ id: string }>) {
  await sendUserInviteWorkflow(container).run({
    input: { id: data.id, trigger: name },
  })
}

export const config: SubscriberConfig = {
  // Admin > Settings > Users: "Invite" and "Resend invite".
  event: ["invite.created", "invite.resent"],
}
