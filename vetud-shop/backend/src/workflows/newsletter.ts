import type { CreateNotificationDTO, MedusaContainer } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { emailSettings } from "../lib/notifications"
import { CONSENT_TEXT, CONSENT_VERSION, getActiveOffer, isValidUnsubscribeToken, NEWSLETTER_GROUP, unsubscribeToken } from "../lib/newsletter"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

type SubscribeInput = { email: string; country_code?: string }

/** Don't email the same address more often than this, however often the form is sent. */
const RESEND_AFTER_MS = 10 * 60 * 1000

const findNewsletterOfferStep = createStep("find-newsletter-offer", async (_input: Record<string, never>, { container }) => {
  return new StepResponse(await getActiveOffer(container))
})

async function newsletterGroupId(container: MedusaContainer) {
  const customers = container.resolve(Modules.CUSTOMER)
  const [existing] = await customers.listCustomerGroups({ name: NEWSLETTER_GROUP })
  return existing?.id ?? (await customers.createCustomerGroups({ name: NEWSLETTER_GROUP })).id
}

/**
 * Records consent on the customer with this email (creating a customer without an account if
 * there is none) and puts them in the Newsletter group. Restores the previous state on failure.
 */
const upsertNewsletterSubscriberStep = createStep(
  "upsert-newsletter-subscriber",
  async (input: SubscribeInput, { container }) => {
    const customers = container.resolve(Modules.CUSTOMER)
    const email = input.email.trim().toLowerCase()
    const now = new Date()
    const matches = await customers.listCustomers({ email }, { relations: ["groups"] })
    // Prefer the customer with an account, so consent shows on the profile they sign in to.
    const existing = matches.sort((a, b) => Number(b.has_account) - Number(a.has_account))[0]
    const sentAt = existing?.metadata?.newsletter_last_sent_at
    const sendEmail = !sentAt || now.getTime() - new Date(String(sentAt)).getTime() > RESEND_AFTER_MS
    const consent = {
      marketing_consent: true,
      marketing_consent_at: now.toISOString(),
      marketing_consent_text: CONSENT_TEXT,
      marketing_consent_version: CONSENT_VERSION,
      marketing_consent_source: "popup",
      ...(input.country_code ? { marketing_consent_country: input.country_code } : {}),
      ...(sendEmail ? { newsletter_last_sent_at: now.toISOString() } : {}),
    }

    const customer = existing
      ? await customers.updateCustomers(existing.id, { metadata: { ...(existing.metadata ?? {}), ...consent } })
      : await customers.createCustomers({ email, has_account: false, metadata: consent })
    const groupId = await newsletterGroupId(container)
    const alreadyInGroup = existing?.groups?.some((group) => group.id === groupId) ?? false
    if (!alreadyInGroup) await customers.addCustomerToGroup({ customer_id: customer.id, customer_group_id: groupId })

    return new StepResponse(
      { email, sendEmail },
      { customerId: customer.id, created: !existing, previousMetadata: existing?.metadata ?? null, groupId, addedToGroup: !alreadyInGroup }
    )
  },
  async (previous, { container }) => {
    if (!previous) return
    const customers = container.resolve(Modules.CUSTOMER)
    if (previous.created) {
      await customers.deleteCustomers(previous.customerId)
      return
    }
    await customers.updateCustomers(previous.customerId, { metadata: previous.previousMetadata ?? {} })
    if (previous.addedToGroup) await customers.removeCustomerFromGroup({ customer_id: previous.customerId, customer_group_id: previous.groupId })
  }
)

/** Signs up an email for offers and sends the current pop-up code, if there is one. */
export const subscribeNewsletterWorkflow = createWorkflow(
  "subscribe-newsletter",
  (input: SubscribeInput) => {
    const offer = findNewsletterOfferStep({})
    const subscriber = upsertNewsletterSubscriberStep(input)
    const notifications = transform({ offer, subscriber, input }, ({ offer: current, subscriber: person, input: data }) => {
      if (!person.sendEmail) return [] as CreateNotificationDTO[]
      const { storefrontUrl } = emailSettings()
      const country = data.country_code && /^[a-z]{2}$/.test(data.country_code) ? `/${data.country_code}` : ""
      const query = new URLSearchParams({ email: person.email, token: unsubscribeToken(person.email) }).toString()
      const notification: CreateNotificationDTO = {
        to: person.email,
        channel: "email",
        template: EmailTemplates.NEWSLETTER_OFFER,
        data: {
          offer: current,
          shop_url: `${storefrontUrl}${country}/shop`,
          unsubscribe_url: `${storefrontUrl}${country}/newsletter/unsubscribe?${query}`,
        },
        trigger_type: "newsletter.subscribed",
      }
      return [notification]
    })
    sendNotificationStep(notifications)
    return new WorkflowResponse({ success: true })
  }
)

/** Withdraws consent for every customer with this email and removes them from the Newsletter group. */
const unsubscribeNewsletterStep = createStep(
  "unsubscribe-newsletter",
  async (input: { email: string; token: string }, { container }) => {
    const email = input.email.trim().toLowerCase()
    if (!isValidUnsubscribeToken(email, input.token)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This unsubscribe link isn't valid. Please use the link from your latest email.")
    }
    const customers = container.resolve(Modules.CUSTOMER)
    const [group] = await customers.listCustomerGroups({ name: NEWSLETTER_GROUP })
    for (const customer of await customers.listCustomers({ email }, { relations: ["groups"] })) {
      await customers.updateCustomers(customer.id, { metadata: { ...(customer.metadata ?? {}), marketing_consent: false, marketing_unsubscribed_at: new Date().toISOString() } })
      if (group && customer.groups?.some((item) => item.id === group.id)) {
        await customers.removeCustomerFromGroup({ customer_id: customer.id, customer_group_id: group.id })
      }
    }
    return new StepResponse({ success: true })
  }
)

export const unsubscribeNewsletterWorkflow = createWorkflow(
  "unsubscribe-newsletter",
  (input: { email: string; token: string }) => new WorkflowResponse(unsubscribeNewsletterStep(input))
)
