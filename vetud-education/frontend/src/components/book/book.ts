import { sdk } from "@/lib/medusa/sdk"

/**
 * "Peptides Explained", a $4.99 PDF book (owner, 2026-11-27). The pop-up takes an email address and
 * sends the visitor to Stripe Checkout. After paying, Stripe brings them back to /book/thank-you and
 * our server emails them how to download the book; the site has no download button. The price itself
 * is set in the backend (src/lib/book.ts).
 */
export const BOOK = {
  title: "Peptides Explained",
  price: "$4.99",
  /** The book on a transparent background, and the same book with its ribbons moving. */
  cover: "/images/book/peptides-explained.webp",
  film: "/media/book/peptides-explained-640.webm",
}

/** Set once this browser has bought the book, so the pop-up doesn't offer it again. */
const BOOK_KEY = "vetud_book_peptides_explained"

export function bookBoughtInBrowser() {
  try {
    return window.localStorage.getItem(BOOK_KEY) === "bought"
  } catch {
    return false
  }
}

export function rememberBookBought() {
  try {
    window.localStorage.setItem(BOOK_KEY, "bought")
  } catch {
    // The email still arrives without browser storage.
  }
}

/** Returns the address of Stripe's payment page for this email. */
export async function startBookCheckout(input: { email: string; language: string; website?: string }) {
  const { url } = await sdk.client.fetch<{ url: string | null }>("/store/book/checkout", {
    method: "POST",
    body: { email: input.email.trim(), locale: input.language, ...(input.website ? { website: input.website } : {}) },
  })
  if (!url) throw new Error("Stripe returned no checkout page")
  return url
}

export async function bookOrder(sessionId: string) {
  return sdk.client.fetch<{ paid: boolean; email: string | null }>("/store/book/order", { query: { session_id: sessionId } })
}
