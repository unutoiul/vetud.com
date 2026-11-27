import { existsSync } from "node:fs"
import { join } from "node:path"
import { MedusaError } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * "Peptides Explained", a PDF book sold on vetud.com for $4.99 (owner, 2026-11-27). The buyer enters
 * their email, pays on a Stripe Checkout page, and gets an email with how to download the book (sent
 * from the Stripe webhook, api/hooks/stripe-book). The site itself has no download button.
 *
 * There is no order table: the paid Stripe Checkout Session is the proof of purchase, and its id is
 * the key in the emailed download link (GET /book/download?session_id=…).
 *
 * The Stripe account has Managed Payments on: Stripe is the seller of record and handles sales tax and
 * VAT, which needs a product tax code and rules out Checkout's custom text.
 *
 * Settings (Railway → education backend → Variables):
 * - STRIPE_SECRET_KEY: a Stripe secret or restricted key (rk_live_… with Checkout Sessions: Write).
 * - STRIPE_BOOK_WEBHOOK_SECRET: the signing secret (whsec_…) of the webhook endpoint
 *   <backend>/hooks/stripe-book (checkout.session.completed, checkout.session.async_payment_succeeded).
 * - BOOK_DOWNLOAD_URL (optional): where the PDF is hosted (Google Drive, Dropbox…). The emailed link
 *   checks the payment, then forwards there.
 * - BOOK_PDF_PATH (optional): otherwise the PDF is sent from this server: by default
 *   `private/peptides-explained.pdf` in this backend folder, which is not served publicly.
 */
export const BOOK = {
  id: "peptides-explained",
  title: "Peptides Explained",
  name: "Peptides Explained (PDF book)",
  description: "32 peptides explained in detail. The download link is emailed after payment.",
  currency: "usd",
  amount: 499,
  // Stripe tax code "Digital Books - downloaded - non subscription - with permanent rights".
  taxCode: "txcd_10302000",
  file: "peptides-explained.pdf",
  downloadName: "Peptides Explained - VETUD.pdf",
} as const

/** Stripe Checkout Session ids look like cs_live_… or cs_test_…. */
export const CHECKOUT_SESSION_ID = /^cs_(live|test)_[A-Za-z0-9]{10,200}$/

let client: Stripe | undefined

export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Card payment for the book isn't set up yet.")
  client ??= new Stripe(key)
  return client
}

export const isPaidBookSession = (session: Stripe.Checkout.Session) =>
  session.metadata?.product === BOOK.id && session.payment_status === "paid"

/** The Checkout Session if it paid for the book, otherwise null. */
export async function paidBookSession(sessionId: string) {
  if (!CHECKOUT_SESSION_ID.test(sessionId)) return null
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId)
    return isPaidBookSession(session) ? session : null
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) return null
    throw error
  }
}

export const buyerEmail = (session: Stripe.Checkout.Session) =>
  session.customer_details?.email ?? session.customer_email ?? null

/** The link in the buyer's email. It works for as long as the payment stands. */
export function bookDownloadLink(sessionId: string) {
  const backend = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9100").replace(/\/$/, "")
  return `${backend}/book/download?session_id=${encodeURIComponent(sessionId)}`
}

/** Where the PDF is hosted, if it isn't on this server. Only http(s) addresses are used. */
export function hostedBookUrl(): string | null {
  const url = process.env.BOOK_DOWNLOAD_URL?.trim()
  return url && /^https?:\/\//i.test(url) ? url : null
}

/** The PDF on the server. The server runs from .medusa/server, two folders below this one. */
export function bookPdfPath(): string | null {
  const candidates = [
    process.env.BOOK_PDF_PATH?.trim(),
    join(process.cwd(), "private", BOOK.file),
    join(process.cwd(), "..", "..", "private", BOOK.file),
  ]
  return candidates.find((path): path is string => !!path && existsSync(path)) ?? null
}
