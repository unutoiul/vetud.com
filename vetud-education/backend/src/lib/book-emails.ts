import type { CreateNotificationDTO, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { BookOwnerAlertData } from "../modules/resend/owner-alerts"
import { EmailTemplates } from "../modules/resend/templates"
import { emailSettings } from "./notifications"

/** Don't send the same book email to the same address more often than this. */
const REPEAT_AFTER_MS = 10 * 60 * 1000

/** One key per address per 10 minutes: repeats share the idempotency key and aren't sent again. */
export const repeatWindow = (address: string) =>
  `${address.trim().toLowerCase()}:${Math.floor(Date.now() / REPEAT_AFTER_MS)}`

function notification(
  to: string,
  template: string,
  data: Record<string, unknown>,
  key: string,
  trigger: string,
): CreateNotificationDTO {
  return {
    to,
    channel: "email",
    template,
    data,
    trigger_type: trigger,
    idempotency_key: key,
    provider_data: { idempotency_key: key },
  }
}

/**
 * The owner's email for a step of a book order (owner request 2026-11-28), or null when
 * STORE_OWNER_EMAIL isn't set. `key` makes repeats of the same step for the same order send once.
 */
export function bookOwnerAlert(data: Omit<BookOwnerAlertData, "at">, key: string) {
  const { ownerEmail } = emailSettings()
  if (!ownerEmail) return null
  return notification(
    ownerEmail,
    EmailTemplates.BOOK_OWNER_ALERT,
    { ...data, at: new Date().toISOString() },
    `book-owner-alert:${data.step}:${key}`,
    `book.${data.step}`,
  )
}

/** The customer's "finish your order" email, sent when they open the checkout with a typed address. */
export const bookCheckoutStartedEmail = (to: string, buyUrl: string) =>
  notification(
    to,
    EmailTemplates.BOOK_CHECKOUT_STARTED,
    { buy_url: buyUrl },
    `book-checkout-started:${repeatWindow(to)}`,
    "book.checkout_started",
  )

/**
 * Sends each email on its own and never throws: an alert that fails is logged, and the sale or the
 * customer's own email goes ahead regardless.
 */
export async function sendQuietly(scope: MedusaContainer, emails: (CreateNotificationDTO | null)[]) {
  const list = emails.filter((email): email is CreateNotificationDTO => !!email)
  if (!list.length) return
  const service = scope.resolve(Modules.NOTIFICATION)
  const logger = scope.resolve(ContainerRegistrationKeys.LOGGER)
  const results = await Promise.allSettled(list.map((email) => service.createNotifications(email)))
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason)
      logger.error(`Book email "${list[index].template}" to ${list[index].to} failed: ${reason}`)
    }
  })
}
