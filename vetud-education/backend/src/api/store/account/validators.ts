import { z } from "@medusajs/framework/zod"

const Email = z.string().trim().toLowerCase().email().max(254)

/** Step 1 of changing the sign-in email: a code is sent to the new address. */
export const StoreEmailChangeCodeSchema = z.object({ email: Email }).strict()

/** Step 2: the code from that email confirms the change. */
export const StoreChangeEmailSchema = z.object({
  email: Email,
  code: z.string().trim().min(6).max(12),
}).strict()

export type StoreEmailChangeCodeBody = z.infer<typeof StoreEmailChangeCodeSchema>
export type StoreChangeEmailBody = z.infer<typeof StoreChangeEmailSchema>
