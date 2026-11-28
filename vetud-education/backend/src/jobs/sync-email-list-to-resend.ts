import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { EMAIL_LIST_MODULE } from "../modules/email-list"
import type EmailListModuleService from "../modules/email-list/service"
import { addListContact, removeListContact } from "../lib/resend-contacts"

/** Resend allows 10 requests a second; each contact takes two, and emails need room too. */
const PAUSE_MS = 400
/** Each hourly run looks back a little more than an hour, so nothing falls between two runs. */
const LOOK_BACK_MS = 2 * 60 * 60 * 1000

let fullSyncDone = false
let running = false

const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS))

/**
 * Keeps the Resend email-list segment in line with the database. The first run after the server
 * starts copies every subscriber (so the list that existed before is in Resend too); after that, only
 * those who confirmed or unsubscribed in the last two hours, in case the instant copy failed.
 */
export default async function syncEmailListToResend(container: MedusaContainer) {
  if (running || !process.env.RESEND_API_KEY) return
  running = true
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const service = container.resolve<EmailListModuleService>(EMAIL_LIST_MODULE)
    const since = new Date(Date.now() - LOOK_BACK_MS)
    const subscribers = await service.listEmailSubscribers(
      {
        status: ["confirmed", "unsubscribed"],
        ...(fullSyncDone ? { updated_at: { $gte: since } } : {}),
      },
      { select: ["email", "locale", "status"], take: null },
    )
    let failed = 0
    for (const subscriber of subscribers) {
      try {
        if (subscriber.status === "confirmed") await addListContact(subscriber.email, subscriber.locale)
        else await removeListContact(subscriber.email)
      } catch (error) {
        failed += 1
        logger.warn(error instanceof Error ? error.message : String(error))
      }
      await pause()
    }
    if (!fullSyncDone || subscribers.length) {
      logger.info(
        `Email list → Resend: ${subscribers.length - failed} of ${subscribers.length} synced${fullSyncDone ? "" : " (full sync)"}`,
      )
    }
    if (!failed) fullSyncDone = true
  } finally {
    running = false
  }
}

export const config = {
  name: "sync-email-list-to-resend",
  schedule: "7 * * * *",
}
