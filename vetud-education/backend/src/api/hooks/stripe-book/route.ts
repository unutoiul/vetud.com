import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type Stripe from "stripe"
import { BOOK, bookDownloadLink, buyerEmail, isPaidBookSession, stripe } from "../../../lib/book"
import { bookOwnerAlert, sendQuietly } from "../../../lib/book-emails"
import { EmailTemplates } from "../../../modules/resend/templates"

const EVENTS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"])

/**
 * Stripe calls this when a Checkout is paid. For the book it emails the buyer their download link,
 * once per payment (the idempotency key stops repeats when Stripe sends an event twice).
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const secret = process.env.STRIPE_BOOK_WEBHOOK_SECRET?.trim()
  const signature = req.headers["stripe-signature"]
  if (!secret) {
    res.status(503).json({ message: "The book webhook isn't set up (STRIPE_BOOK_WEBHOOK_SECRET)." })
    return
  }
  if (typeof signature !== "string" || !req.rawBody) {
    res.status(400).json({ message: "Missing webhook signature." })
    return
  }

  let event: Stripe.Event
  try {
    event = stripe().webhooks.constructEvent(req.rawBody, signature, secret)
  } catch {
    res.status(400).json({ message: "Invalid webhook signature." })
    return
  }

  if (EVENTS.has(event.type)) {
    const session = event.data.object as Stripe.Checkout.Session
    const to = buyerEmail(session)
    if (isPaidBookSession(session) && to) {
      const key = `book-purchase:${session.id}`
      await req.scope.resolve(Modules.NOTIFICATION).createNotifications({
        to,
        channel: "email",
        template: EmailTemplates.BOOK_PURCHASE,
        data: { download_url: bookDownloadLink(session.id), title: BOOK.title },
        trigger_type: event.type,
        resource_id: session.id,
        resource_type: "stripe_checkout_session",
        idempotency_key: key,
        provider_data: { idempotency_key: key },
      })
      await sendQuietly(req.scope, [bookOwnerAlert({
        step: "paid",
        email: to,
        locale: session.metadata?.locale,
        session_id: session.id,
        amount: session.amount_total,
        currency: session.currency,
      }, session.id)])
    }
  }
  res.json({ received: true })
}
