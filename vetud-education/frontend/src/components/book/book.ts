import { sdk } from "@/lib/medusa/sdk"

/**
 * "Peptides Explained", a $4.99 PDF book (owner, 2026-11-27). The steps:
 * 1. The pop-up takes an email address and says to check the inbox.
 * 2. That email links to the book's page, /book?t=…, where the visitor pays with Stripe Checkout.
 * 3. Stripe brings them back to /book/thank-you, and our server emails the download link.
 * The site has no download button. The price itself is set in the backend (src/lib/book.ts).
 */
export const BOOK = {
  title: "Peptides Explained",
  price: "$4.99",
  /** The book on a transparent background, and the same book with its ribbons moving. */
  cover: "/images/book/peptides-explained.webp",
  film: "/media/book/peptides-explained-640.webm",
}

/** Set once this browser has asked for (or bought) the book, so the pop-up doesn't offer it again. */
const BOOK_KEY = "vetud_book_peptides_explained"

export function bookHandledInBrowser() {
  try {
    const value = window.localStorage.getItem(BOOK_KEY)
    return value === "requested" || value === "bought"
  } catch {
    return false
  }
}

function remember(value: "requested" | "bought") {
  try {
    window.localStorage.setItem(BOOK_KEY, value)
  } catch {
    // Everything still works without browser storage.
  }
}

/** Step 1: email the visitor the link to the book's page. */
export async function requestBook(input: { email: string; language: string; website?: string }) {
  const result = await sdk.client.fetch<{ success: boolean }>("/store/book/request", {
    method: "POST",
    body: { email: input.email.trim(), locale: input.language, ...(input.website ? { website: input.website } : {}) },
  })
  if (result.success !== true) throw new Error("The book link was not sent")
  remember("requested")
}

/** The address in the email link's token, or null when the link is invalid or has expired. */
export async function bookOfferEmail(token: string) {
  const { email } = await sdk.client.fetch<{ email: string | null }>("/store/book/offer", { query: { token } })
  return email
}

/** Step 2: the address of Stripe's payment page, for the email link's token or a typed address. */
export async function startBookCheckout(input: { token?: string; email?: string; language: string; website?: string }) {
  const { url } = await sdk.client.fetch<{ url: string | null }>("/store/book/checkout", {
    method: "POST",
    body: {
      locale: input.language,
      ...(input.token ? { token: input.token } : { email: input.email?.trim() }),
      ...(input.website ? { website: input.website } : {}),
    },
  })
  if (!url) throw new Error("Stripe returned no checkout page")
  return url
}

/** Step 3: whether the payment went through, for the thank-you page. */
export async function bookOrder(sessionId: string) {
  const order = await sdk.client.fetch<{ paid: boolean; email: string | null }>("/store/book/order", {
    query: { session_id: sessionId },
  })
  if (order.paid) remember("bought")
  return order
}
