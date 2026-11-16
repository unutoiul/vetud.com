import { z } from "@medusajs/framework/zod"

export const StoreGuestOrderAccountSchema = z.object({
  /** The cart the order came from; only the browser that checked out has it. */
  cart_id: z.string().regex(/^cart_[A-Za-z0-9]+$/),
  /** Needed to create a new account; not used when a signed-in member adds the order. */
  password: z.string().min(8).max(128).optional(),
})

export type StoreGuestOrderAccountBody = z.infer<typeof StoreGuestOrderAccountSchema>
