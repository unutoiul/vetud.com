import { z } from "@medusajs/framework/zod"

/** Same minimum as sign-up and password reset on the storefront. */
const Password = z.string().min(8).max(200)

export const StoreChangePasswordSchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: Password,
}).strict()

export const StoreChangeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
}).strict()

export type StoreChangePasswordBody = z.infer<typeof StoreChangePasswordSchema>
export type StoreChangeEmailBody = z.infer<typeof StoreChangeEmailSchema>
