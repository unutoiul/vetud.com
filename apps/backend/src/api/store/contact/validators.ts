import { z } from "@medusajs/framework/zod"

export const StoreContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  subject: z.string().trim().max(160).optional(),
  order_number: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10).max(5000),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional(),
})

export type StoreContactBody = z.infer<typeof StoreContactSchema>
