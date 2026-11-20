import { z } from "@medusajs/framework/zod"

export const StoreSignInCodeSchema = z.object({
  email: z.string().trim().email().max(254),
})

export type StoreSignInCodeBody = z.infer<typeof StoreSignInCodeSchema>
