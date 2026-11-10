import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendPasswordResetEmailWorkflow } from "../workflows/send-password-reset-email"

type PasswordResetEvent = {
  entity_id: string
  actor_type: string
  token: string
  metadata?: Record<string, unknown>
}

export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  if (data.actor_type !== "customer" && data.actor_type !== "user") {
    return
  }

  await sendPasswordResetEmailWorkflow(container).run({
    input: {
      email: data.entity_id,
      token: data.token,
      actor_type: data.actor_type,
      country_code: data.metadata?.country_code,
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
