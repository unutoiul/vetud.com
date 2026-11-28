import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { EMAIL_LIST_CONFIRMED_EVENT, type EmailListConfirmedEvent } from "../lib/email-list"
import { addListContact } from "../lib/resend-contacts"
import { sendEmailListSignupAlertWorkflow } from "../workflows/send-owner-alerts"

/**
 * A new, confirmed email-list subscriber: copies them into the Resend email-list segment and tells the
 * owner. Each runs on its own, so one failing doesn't stop the other; a contact that couldn't be
 * copied is picked up by the hourly sync (jobs/sync-email-list-to-resend.ts).
 */
export default async function emailListConfirmedHandler({
  event: { data },
  container,
}: SubscriberArgs<EmailListConfirmedEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const results = await Promise.allSettled([
    addListContact(data.email, data.locale, { resubscribe: true }),
    sendEmailListSignupAlertWorkflow(container).run({ input: data }),
  ])
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason)
      logger.error(
        `Email-list sign-up ${data.email}: ${index === 0 ? "Resend contact" : "owner alert"} failed: ${reason}`,
      )
    }
  })
}

export const config: SubscriberConfig = {
  event: EMAIL_LIST_CONFIRMED_EVENT,
}
