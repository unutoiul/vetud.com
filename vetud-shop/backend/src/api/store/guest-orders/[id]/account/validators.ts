import { z } from "@medusajs/framework/zod"

export const StoreGuestOrderAccountSchema = z.object({
  /** The cart the order came from; only the browser that checked out has it. */
  cart_id: z.string().regex(/^cart_[A-Za-z0-9]+$/),
})

export type StoreGuestOrderAccountBody = z.infer<typeof StoreGuestOrderAccountSchema>
