import { z } from "@medusajs/framework/zod"

export const StoreSetCheckoutEmailSchema = z.object({
  email: z.string().trim().email().max(254),
})

export type StoreSetCheckoutEmailBody = z.infer<typeof StoreSetCheckoutEmailSchema>
