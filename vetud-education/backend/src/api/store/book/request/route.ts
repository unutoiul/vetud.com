import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { offerToken } from "../../../../lib/book"
import { bookOwnerAlert, repeatWindow, sendQuietly } from "../../../../lib/book-emails"
import { emailSettings } from "../../../../lib/notifications"
import { EmailTemplates } from "../../../../modules/resend/templates"
import type { StoreBookRequestBody } from "../validators"

/**
 * The pop-up's email address: we email them a link to the book's page on vetud.com, where they can
 * pay for it, and tell the owner. The answer is the same whatever the address.
 */
export async function POST(req: MedusaRequest<StoreBookRequestBody>, res: MedusaResponse) {
  const { email, locale } = req.validatedBody
  const address = email.trim().toLowerCase()
  const query = new URLSearchParams({ t: offerToken(address) }).toString()
  // One email per address per 10 minutes: repeats share the idempotency key and aren't sent again.
  const key = `book-offer:${repeatWindow(address)}`
  await req.scope.resolve(Modules.NOTIFICATION).createNotifications({
    to: address,
    channel: "email",
    template: EmailTemplates.BOOK_OFFER,
    data: { buy_url: `${emailSettings().storefrontUrl}/${locale}/book?${query}` },
    trigger_type: "book.requested",
    idempotency_key: key,
    provider_data: { idempotency_key: key },
  })
  await sendQuietly(req.scope, [bookOwnerAlert({ step: "requested", email: address, locale }, repeatWindow(address))])
  res.status(201).json({ success: true })
}
