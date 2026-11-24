import { z } from "@medusajs/framework/zod"
import { LIST_LOCALES } from "../../../lib/email-list"

const Email = z.string().trim().max(254).pipe(z.email())
const Token = z.string().trim().min(10).max(200)

export const StoreEmailListSchema = z.object({
  email: Email,
  // Sent by the sign-up form when the visitor presses its button; that press is the consent.
  consent: z.literal(true),
  locale: z.enum(LIST_LOCALES).default("en"),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional(),
})

export const StoreConfirmEmailListSchema = z.object({
  email: Email,
  expires: z.coerce.number().int().positive(),
  token: Token,
})

export const StoreUnsubscribeEmailListSchema = z.object({
  email: Email,
  token: Token,
})

export type StoreEmailListBody = z.infer<typeof StoreEmailListSchema>
export type StoreConfirmEmailListBody = z.infer<typeof StoreConfirmEmailListSchema>
export type StoreUnsubscribeEmailListBody = z.infer<typeof StoreUnsubscribeEmailListSchema>
