import type { CreateNotificationDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emailSettings } from "../lib/notifications"
import {
  guestCheckoutAlertKey,
  isGuestCheckout,
  type GuestCartRow,
  type NewsletterSubscribedEvent,
} from "../lib/owner-alerts"
import type { GuestCheckoutAlertData, NewsletterSignupAlertData } from "../modules/resend/owner-alerts"
import { EmailTemplates } from "../modules/resend/templates"
import { sendNotificationStep } from "./steps/send-notification"

/** Emails the owner about a new newsletter sign-up. Nothing is sent when STORE_OWNER_EMAIL isn't set. */
export const sendNewsletterSignupAlertWorkflow = createWorkflow(
  "send-newsletter-signup-alert",
  function (input: NewsletterSubscribedEvent) {
    const notifications = transform({ input }, ({ input: signup }) => {
      const { ownerEmail, adminUrl } = emailSettings()
      if (!ownerEmail) return [] as CreateNotificationDTO[]
      const data: NewsletterSignupAlertData = {
        email: signup.email,
        country_code: signup.country_code,
        has_account: signup.has_account,
        offer_code: signup.offer_code,
        subscribed_at: signup.subscribed_at,
        customer_url: `${adminUrl}/app/customers/${signup.customer_id}`,
      }
      const notification: CreateNotificationDTO = {
        to: ownerEmail,
        channel: "email",
        template: EmailTemplates.NEWSLETTER_SIGNUP_ADMIN,
        data,
        trigger_type: "newsletter.subscribed",
        resource_id: signup.customer_id,
        resource_type: "customer",
      }
      return [notification]
    })
    return new WorkflowResponse(sendNotificationStep(notifications))
  },
)

type CartRow = Omit<GuestCartRow, "items"> & {
  created_at: string | Date
  currency_code: string
  region?: { name?: string | null } | null
  items?:
    | {
        title?: string | null
        product_title?: string | null
        variant_title?: string | null
        quantity?: number | string | null
        unit_price?: number | string | null
      }[]
    | null
}

/**
 * The owner alert for a guest checkout, or nothing when the cart isn't one (see isGuestCheckout).
 * Runs on every cart update; the idempotency key keeps it to one email per cart and address.
 */
const buildGuestCheckoutAlertStep = createStep(
  "build-guest-checkout-alert",
  async (input: { id: string }, { container }) => {
    const { ownerEmail, adminUrl } = emailSettings()
    if (!ownerEmail) return new StepResponse([] as CreateNotificationDTO[])
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "created_at",
        "completed_at",
        "currency_code",
        "region.name",
        "customer.has_account",
        "items.id",
        "items.title",
        "items.product_title",
        "items.variant_title",
        "items.quantity",
        "items.unit_price",
      ],
      filters: { id: input.id },
    })
    const cart = carts[0] as CartRow | undefined
    if (!isGuestCheckout(cart)) return new StepResponse([] as CreateNotificationDTO[])

    const email = cart.email.trim().toLowerCase()
    const key = guestCheckoutAlertKey(cart.id, email)
    // Checked here as well as by the Notification Module, so a failed send isn't retried on every cart change.
    const { data: sent } = await query.graph({
      entity: "notification",
      fields: ["id"],
      filters: { idempotency_key: key },
    })
    if (sent.length) return new StepResponse([] as CreateNotificationDTO[])

    const { data: members } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email, has_account: true },
    })
    const data: GuestCheckoutAlertData = {
      email,
      currency_code: cart.currency_code,
      items: (cart.items ?? []).map((item) => ({
        title: [item.product_title ?? item.title, item.variant_title].filter(Boolean).join(" · "),
        quantity: Number(item.quantity ?? 0),
        unit_price: Number(item.unit_price ?? 0),
      })),
      region: cart.region?.name ?? null,
      account_exists: members.length > 0,
      started_at: new Date(cart.created_at).toISOString(),
      unfinished_url: `${adminUrl}/app/unfinished-checkouts`,
    }
    const notification: CreateNotificationDTO = {
      to: ownerEmail,
      channel: "email",
      template: EmailTemplates.GUEST_CHECKOUT_ADMIN,
      data,
      trigger_type: "cart.guest_checkout_started",
      resource_id: cart.id,
      resource_type: "cart",
      idempotency_key: key,
    }
    return new StepResponse([notification])
  },
)

/** Emails the owner once when a guest (not signed in) gives their email at checkout. */
export const sendGuestCheckoutAlertWorkflow = createWorkflow(
  "send-guest-checkout-alert",
  function (input: { id: string }) {
    const notifications = buildGuestCheckoutAlertStep(input)
    return new WorkflowResponse(sendNotificationStep(notifications))
  },
)
