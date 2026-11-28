import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { NEWSLETTER_GROUP } from "../lib/newsletter"
import { addShopContact, CONTACT_SOURCES, removeShopContact } from "../lib/resend-contacts"
import { BESLIMNOW_MODULE } from "../modules/beslimnow"
import type BeslimnowModuleService from "../modules/beslimnow/service"

/** Resend allows 10 requests a second; each contact takes two, and emails need room too. */
const PAUSE_MS = 400
/** Each hourly run looks back a little more than an hour, so nothing falls between two runs. */
const LOOK_BACK_MS = 2 * 60 * 60 * 1000

let fullSyncDone = false
let running = false

const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS))

type Change = { email: string; add: boolean; source: string; country?: string | null }

/**
 * Keeps the Resend segment in line with the shop's newsletter (customers in the Newsletter group) and
 * the BeSlimNow sign-ups. The first run after the server starts copies everyone (so earlier sign-ups
 * are in Resend too); after that, only changes from the last two hours, in case the instant copy failed.
 */
export default async function syncNewsletterToResend(container: MedusaContainer) {
  if (running || !process.env.RESEND_API_KEY) return
  running = true
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const since = new Date(Date.now() - LOOK_BACK_MS)
    const recent = fullSyncDone ? { updated_at: { $gte: since.toISOString() } } : {}
    const customers = container.resolve(Modules.CUSTOMER)
    const [group] = await customers.listCustomerGroups({ name: NEWSLETTER_GROUP })
    const people = await customers.listCustomers(recent, {
      select: ["id", "email", "metadata"],
      relations: ["groups"],
      take: null,
    })
    const changes: Change[] = []
    for (const person of people) {
      const subscribed = !!group && !!person.groups?.some((item) => item.id === group.id)
      const metadata = person.metadata ?? {}
      if (subscribed) {
        const country =
          typeof metadata.marketing_consent_country === "string" ? metadata.marketing_consent_country : null
        changes.push({ email: person.email, add: true, source: CONTACT_SOURCES.shopPopup, country })
      } else if (metadata.marketing_unsubscribed_at) {
        changes.push({ email: person.email, add: false, source: CONTACT_SOURCES.shopPopup })
      }
    }
    const beslimnow = container.resolve<BeslimnowModuleService>(BESLIMNOW_MODULE)
    const signups = await beslimnow.listBeslimnowSubscribers(fullSyncDone ? { last_seen_at: { $gte: since } } : {}, {
      select: ["email", "country"],
      take: null,
    })
    for (const signup of signups) {
      changes.push({ email: signup.email, add: true, source: CONTACT_SOURCES.beslimnow, country: signup.country })
    }

    let failed = 0
    for (const change of changes) {
      try {
        if (change.add) {
          await addShopContact(change.email.trim().toLowerCase(), change.source, { country: change.country })
        } else await removeShopContact(change.email.trim().toLowerCase())
      } catch (error) {
        failed += 1
        logger.warn(error instanceof Error ? error.message : String(error))
      }
      await pause()
    }
    if (!fullSyncDone || changes.length) {
      logger.info(
        `Newsletter → Resend: ${changes.length - failed} of ${changes.length} synced${fullSyncDone ? "" : " (full sync)"}`,
      )
    }
    if (!failed) fullSyncDone = true
  } finally {
    running = false
  }
}

export const config = {
  name: "sync-newsletter-to-resend",
  schedule: "17 * * * *",
}
