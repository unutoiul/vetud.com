import type { CreateNotificationDTO } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, createWorkflow, StepResponse, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import {
  CONFIRM_LINK_TTL_MS,
  confirmToken,
  CONSENT_TEXT,
  CONSENT_VERSION,
  isValidConfirmToken,
  isValidUnsubscribeToken,
  type ListLocale,
  normalizeEmail,
} from "../lib/email-list"
import { emailSettings } from "../lib/notifications"
import { EMAIL_LIST_MODULE } from "../modules/email-list"
import type EmailListModuleService from "../modules/email-list/service"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

type SubscribeInput = { email: string; locale: ListLocale }
type ConfirmInput = { email: string; expires: number; token: string }
type UnsubscribeInput = { email: string; token: string }
type SubscriberResult = { email: string; locale: ListLocale; sendEmail: boolean }
type SubscriberState = {
  locale: string
  status: "pending" | "confirmed" | "unsubscribed"
  consent_text: string
  consent_version: string
  consented_at: Date
  confirmation_sent_at: Date | null
  unsubscribed_at: Date | null
}
type SubscriberUndo = { id: string; previous: SubscriberState | null } | null

/** Don't email the same address more often than this, however often the form is sent. */
const RESEND_AFTER_MS = 10 * 60 * 1000

/** Records consent as "pending". An address that has already confirmed is left alone. */
const upsertEmailSubscriberStep = createStep<SubscribeInput, SubscriberResult, SubscriberUndo>(
  "upsert-email-subscriber",
  async (input, { container }) => {
    const service = container.resolve<EmailListModuleService>(EMAIL_LIST_MODULE)
    const email = normalizeEmail(input.email)
    const now = new Date()
    const [existing] = await service.listEmailSubscribers({ email })
    if (existing?.status === "confirmed") {
      return new StepResponse({ email, locale: input.locale, sendEmail: false }, null)
    }

    const sentAt = existing?.confirmation_sent_at
    const sendEmail = !sentAt || now.getTime() - new Date(sentAt).getTime() > RESEND_AFTER_MS
    const values = {
      locale: input.locale,
      status: "pending" as const,
      consent_text: CONSENT_TEXT[input.locale],
      consent_version: CONSENT_VERSION,
      consented_at: now,
      unsubscribed_at: null,
      ...(sendEmail ? { confirmation_sent_at: now } : {}),
    }

    if (!existing) {
      const created = await service.createEmailSubscribers({ email, ...values })
      return new StepResponse({ email, locale: input.locale, sendEmail }, { id: created.id, previous: null })
    }
    await service.updateEmailSubscribers({ id: existing.id, ...values })
    return new StepResponse({ email, locale: input.locale, sendEmail }, {
      id: existing.id,
      previous: {
        locale: existing.locale,
        status: existing.status,
        consent_text: existing.consent_text,
        consent_version: existing.consent_version,
        consented_at: existing.consented_at,
        confirmation_sent_at: existing.confirmation_sent_at,
        unsubscribed_at: existing.unsubscribed_at,
      },
    })
  },
  async (undo, { container }) => {
    if (!undo) return
    const service = container.resolve<EmailListModuleService>(EMAIL_LIST_MODULE)
    if (!undo.previous) {
      await service.deleteEmailSubscribers(undo.id)
      return
    }
    await service.updateEmailSubscribers({ id: undo.id, ...undo.previous })
  }
)

/** Starts a sign-up and emails the confirmation link. Nothing else is sent until it's confirmed. */
export const subscribeEmailListWorkflow = createWorkflow(
  "subscribe-email-list",
  function (input: SubscribeInput) {
    const subscriber = upsertEmailSubscriberStep(input)
    const notifications = transform({ subscriber }, ({ subscriber: person }) => {
      if (!person.sendEmail) return [] as CreateNotificationDTO[]
      const expires = Date.now() + CONFIRM_LINK_TTL_MS
      const query = new URLSearchParams({ email: person.email, expires: String(expires), token: confirmToken(person.email, expires) }).toString()
      const notification: CreateNotificationDTO = {
        to: person.email,
        channel: "email",
        template: EmailTemplates.EMAIL_LIST_CONFIRM,
        data: { locale: person.locale, confirm_url: `${emailSettings().storefrontUrl}/${person.locale}/newsletter/confirm?${query}` },
        trigger_type: "email_list.subscribed",
      }
      return [notification]
    })
    sendNotificationStep(notifications)
    return new WorkflowResponse({ success: true })
  }
)

const confirmEmailSubscriberStep = createStep(
  "confirm-email-subscriber",
  async (input: ConfirmInput, { container }) => {
    const email = normalizeEmail(input.email)
    const invalid = new MedusaError(MedusaError.Types.NOT_ALLOWED, "This confirmation link isn't valid any more. Please sign up again.")
    if (!isValidConfirmToken(email, input.expires, input.token)) throw invalid
    const service = container.resolve<EmailListModuleService>(EMAIL_LIST_MODULE)
    const [subscriber] = await service.listEmailSubscribers({ email })
    // An old link must not bring back someone who has since unsubscribed.
    if (!subscriber || subscriber.status === "unsubscribed") throw invalid
    if (subscriber.status === "pending") {
      await service.updateEmailSubscribers({ id: subscriber.id, status: "confirmed", confirmed_at: new Date() })
    }
    return new StepResponse({ success: true })
  }
)

/** Called when someone presses Confirm on the page their email links to. */
export const confirmEmailListWorkflow = createWorkflow(
  "confirm-email-list",
  function (input: ConfirmInput) {
    return new WorkflowResponse(confirmEmailSubscriberStep(input))
  }
)

const unsubscribeEmailSubscriberStep = createStep(
  "unsubscribe-email-subscriber",
  async (input: UnsubscribeInput, { container }) => {
    const email = normalizeEmail(input.email)
    if (!isValidUnsubscribeToken(email, input.token)) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This unsubscribe link isn't valid. Please use the link from your latest email.")
    }
    const service = container.resolve<EmailListModuleService>(EMAIL_LIST_MODULE)
    const [subscriber] = await service.listEmailSubscribers({ email })
    if (subscriber && subscriber.status !== "unsubscribed") {
      await service.updateEmailSubscribers({ id: subscriber.id, status: "unsubscribed", unsubscribed_at: new Date() })
    }
    return new StepResponse({ success: true })
  }
)

export const unsubscribeEmailListWorkflow = createWorkflow(
  "unsubscribe-email-list",
  function (input: UnsubscribeInput) {
    return new WorkflowResponse(unsubscribeEmailSubscriberStep(input))
  }
)
