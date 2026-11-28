import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { BOOK, offerToken, readOfferToken, stripe } from "../../../../lib/book"
import { bookCheckoutStartedEmail, bookOwnerAlert, repeatWindow, sendQuietly } from "../../../../lib/book-emails"
import { emailSettings } from "../../../../lib/notifications"
import type { StoreBookCheckoutBody } from "../validators"

/** The VETUD mark for Stripe's payment page; Stripe fetches it, so it is always the live site's copy. */
const VETUD_MARK = "https://www.vetud.com/brand/vetud-mark-square.png"

/**
 * The "Pay $4.99" button on the book's page: starts a Stripe Checkout for the address from the email
 * link (or typed on the page) and returns the address of Stripe's payment page.
 */
export async function POST(req: MedusaRequest<StoreBookCheckoutBody>, res: MedusaResponse) {
  const { token, locale } = req.validatedBody
  const email = token ? readOfferToken(token) : req.validatedBody.email
  if (!email) throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This link has expired. Enter your email address to continue.")
  const site = emailSettings().storefrontUrl
  const back = `${site}/${locale}/book${token ? `?${new URLSearchParams({ t: token })}` : ""}`
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: BOOK.currency,
        unit_amount: BOOK.amount,
        // Buyers pay $4.99 whatever their country; Stripe takes any sales tax or VAT out of it.
        tax_behavior: "inclusive",
        // The product made in the Stripe Dashboard: its name, image and tax code show at checkout.
        product: BOOK.stripeProduct,
      },
    }],
    // The Stripe account belongs to BlueTrendy Development LTD; the payment page says "Pay VETUD".
    branding_settings: {
      display_name: "VETUD",
      icon: { type: "url", url: VETUD_MARK },
      logo: { type: "url", url: VETUD_MARK },
    },
    metadata: { product: BOOK.id, locale },
    payment_intent_data: { description: BOOK.name, metadata: { product: BOOK.id } },
    success_url: `${site}/${locale}/book/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: back,
  })
  res.json({ url: session.url })

  // After answering, so the visitor goes to Stripe without waiting (owner request 2026-11-28): the owner
  // hears that a checkout opened, and a visitor who typed their address gets a link to finish later.
  // Visitors who came from the email link already have that link.
  const address = email.trim().toLowerCase()
  const finishUrl = `${site}/${locale}/book?${new URLSearchParams({ t: token || offerToken(address) })}`
  void sendQuietly(req.scope, [
    bookOwnerAlert({ step: "checkout", email: address, locale, session_id: session.id }, repeatWindow(address)),
    token ? null : bookCheckoutStartedEmail(address, finishUrl),
  ])
}
