import { z } from "@medusajs/framework/zod"

export const StoreNewsletterSchema = z.object({
  email: z.string().trim().email().max(254),
  // Consent must be given explicitly; the checkbox starts unticked.
  consent: z.literal(true),
  country_code: z.string().trim().toLowerCase().regex(/^[a-z]{2}$/).optional(),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional(),
})

export const StoreNewsletterUnsubscribeSchema = z.object({
  email: z.string().trim().email().max(254),
  token: z.string().trim().min(10).max(200),
})

export type StoreNewsletterBody = z.infer<typeof StoreNewsletterSchema>
export type StoreNewsletterUnsubscribeBody = z.infer<typeof StoreNewsletterUnsubscribeSchema>
