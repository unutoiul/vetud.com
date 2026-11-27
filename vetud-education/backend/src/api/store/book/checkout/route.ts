import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOK, stripe } from "../../../../lib/book"
import { emailSettings } from "../../../../lib/notifications"
import type { StoreBookCheckoutBody } from "../validators"

/** Starts a Stripe Checkout for the book and returns the address of Stripe's payment page. */
export async function POST(req: MedusaRequest<StoreBookCheckoutBody>, res: MedusaResponse) {
  const { email, locale } = req.validatedBody
  const site = emailSettings().storefrontUrl
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
        product_data: { name: BOOK.name, description: BOOK.description, tax_code: BOOK.taxCode },
      },
    }],
    metadata: { product: BOOK.id, locale },
    payment_intent_data: { description: BOOK.name, metadata: { product: BOOK.id } },
    success_url: `${site}/${locale}/book/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/${locale}`,
  })
  res.json({ url: session.url })
}
