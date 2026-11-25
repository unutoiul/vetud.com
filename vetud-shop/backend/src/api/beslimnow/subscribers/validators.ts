import { z } from "@medusajs/framework/zod"

export const BeslimnowSubscriberSchema = z.object({
  // As loose as the page's own check, so a signup it accepted is never refused here.
  email: z.string().trim().max(254).regex(/^[^\s@]+@[^\s@]+$/),
  // Two-letter country code, or empty when the page couldn't tell.
  country: z
    .string()
    .regex(/^([A-Za-z]{2})?$/)
    .nullish(),
  signup_form: z.string().trim().max(40).optional(),
})

export type BeslimnowSubscriberBody = z.infer<typeof BeslimnowSubscriberSchema>
