import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { EMAIL_LIST_CONFIRMED_EVENT, type EmailListConfirmedEvent } from "../lib/email-list"
import { sendEmailListSignupAlertWorkflow } from "../workflows/send-owner-alerts"

/** Tells the owner about a new, confirmed email-list subscriber. */
export default async function emailListConfirmedHandler({
  event: { data },
  container,
}: SubscriberArgs<EmailListConfirmedEvent>) {
  await sendEmailListSignupAlertWorkflow(container).run({ input: data })
}

export const config: SubscriberConfig = {
  event: EMAIL_LIST_CONFIRMED_EVENT,
}
