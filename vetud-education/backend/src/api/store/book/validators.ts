import { z } from "@medusajs/framework/zod"
import { LIST_LOCALES } from "../../../lib/email-list"
import { CHECKOUT_SESSION_ID } from "../../../lib/book"

const Email = z.string().trim().max(254).pipe(z.email())

/** The pop-up: the visitor's email address, to send them the link to the book's page. */
export const StoreBookRequestSchema = z.object({
  email: Email,
  locale: z.enum(LIST_LOCALES).default("en"),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional(),
})

/** The book's page: pay with the token from the email link, or with an address typed on the page. */
export const StoreBookCheckoutSchema = z.object({
  token: z.string().trim().max(600).optional(),
  email: Email.optional(),
  locale: z.enum(LIST_LOCALES).default("en"),
  website: z.string().max(0).optional(),
}).refine((body) => body.token || body.email, { message: "An email address is needed." })

export const StoreBookOfferQuery = z.object({
  token: z.string().trim().max(600),
})

export const StoreBookOrderQuery = z.object({
  session_id: z.string().trim().regex(CHECKOUT_SESSION_ID),
})

export type StoreBookRequestBody = z.infer<typeof StoreBookRequestSchema>
export type StoreBookCheckoutBody = z.infer<typeof StoreBookCheckoutSchema>
export type StoreBookOfferQueryType = z.infer<typeof StoreBookOfferQuery>
export type StoreBookOrderQueryType = z.infer<typeof StoreBookOrderQuery>
