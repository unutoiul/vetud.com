import { z } from "@medusajs/framework/zod"
import { LIST_LOCALES } from "../../../lib/email-list"
import { CHECKOUT_SESSION_ID } from "../../../lib/book"

export const StoreBookCheckoutSchema = z.object({
  email: z.string().trim().max(254).pipe(z.email()),
  locale: z.enum(LIST_LOCALES).default("en"),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional(),
})

export const StoreBookOrderQuery = z.object({
  session_id: z.string().trim().regex(CHECKOUT_SESSION_ID),
})

export type StoreBookCheckoutBody = z.infer<typeof StoreBookCheckoutSchema>
export type StoreBookOrderQueryType = z.infer<typeof StoreBookOrderQuery>
