import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { NEWSLETTER_SUBSCRIBED_EVENT, type NewsletterSubscribedEvent } from "../lib/owner-alerts"
import { sendNewsletterSignupAlertWorkflow } from "../workflows/send-owner-alerts"

/** Tells the owner about a new newsletter sign-up, after the subscriber's own email has gone. */
export default async function newsletterSubscribedHandler({
  event: { data },
  container,
}: SubscriberArgs<NewsletterSubscribedEvent>) {
  await sendNewsletterSignupAlertWorkflow(container).run({ input: data })
}

export const config: SubscriberConfig = {
  event: NEWSLETTER_SUBSCRIBED_EVENT,
}
