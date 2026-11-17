import { z } from "@medusajs/framework/zod"
import { MAX_FREE_SHIPPING_USD } from "../../../lib/free-shipping"

export const AdminSetFreeShipping = z.object({
  /** Free Standard shipping from this cart total in US dollars; null turns it off. */
  amount_usd: z.number().positive().max(MAX_FREE_SHIPPING_USD).nullable(),
})

export type AdminSetFreeShippingBody = z.infer<typeof AdminSetFreeShipping>
