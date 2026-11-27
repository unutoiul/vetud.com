import { createHmac, timingSafeEqual } from "node:crypto"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { MedusaError } from "@medusajs/framework/utils"
import Stripe from "stripe"

/**
 * "Peptides Explained", a PDF book sold on vetud.com for $4.99 (owner, 2026-11-27). The steps:
 * 1. The pop-up takes an email address (POST /store/book/request).
 * 2. We email a link to the book's page on vetud.com (template book-offer, signed token in the link).
 * 3. On that page they pay $4.99 with Stripe Checkout (POST /store/book/checkout).
 * 4. Stripe's webhook (api/hooks/stripe-book) emails the download link (template book-purchase).
 * The site itself has no download button.
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
  // Stripe tax code "Digital Books - downloaded - non subscription - with permanent rights". It belongs
  // on the Stripe product below (Managed Payments needs it); kept here for reference.
  taxCode: "txcd_10302000",
  /** The book's product in the Stripe Dashboard (owner, 2026-11-27): its name and image show at checkout. */
  stripeProduct: "prod_VhoMwg8RhndAWF",
  file: "peptides-explained.pdf",
  downloadName: "Peptides Explained - VETUD.pdf",
} as const

/** How long the link in the first email (to the payment page) keeps working. */
export const OFFER_LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000

function secret() {
  const value = process.env.JWT_SECRET
  if (!value) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "JWT_SECRET is not set.")
  return value
}

const sign = (payload: string) => createHmac("sha256", secret()).update(`book-offer:${payload}`).digest("base64url")

/** The token in the first email's link: the address and an expiry, signed so it can't be forged. */
export function offerToken(email: string, now = Date.now()) {
  const payload = `${Buffer.from(email.trim().toLowerCase()).toString("base64url")}.${now + OFFER_LINK_TTL_MS}`
  return `${payload}.${sign(payload)}`
}

/** The address in a valid, unexpired token, otherwise null. */
export function readOfferToken(token: string, now = Date.now()): string | null {
  const [address, expires, signature] = token.split(".")
  if (!address || !expires || !signature) return null
  const expected = Buffer.from(sign(`${address}.${expires}`))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given) || Number(expires) < now) return null
  return Buffer.from(address, "base64url").toString("utf8")
}

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
