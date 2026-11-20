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
  // Only admin users have passwords: customers sign in with an emailed code (owner, 2026-11-19).
  if (data.actor_type !== "user") {
    return
  }

  await sendPasswordResetEmailWorkflow(container).run({
    input: {
      email: data.entity_id,
      token: data.token,
      actor_type: data.actor_type,
      language: data.metadata?.language,
    },
  })
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
