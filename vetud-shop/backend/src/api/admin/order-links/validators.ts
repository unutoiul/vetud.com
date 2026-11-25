import { z } from "@medusajs/framework/zod"

const optionalText = (max: number) => z.string().trim().max(max).optional()

/** POST /admin/order-links: the items and (optionally) who the link is for. */
export const AdminCreateOrderLink = z.object({
  country_code: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .transform((code) => code.toLowerCase()),
  items: z
    .array(z.object({ variant_id: z.string().trim().min(1), quantity: z.number().int().min(1).max(100) }))
    .min(1)
    .max(30),
  promo_code: optionalText(60),
  customer_name: optionalText(120),
  whatsapp: optionalText(40),
  email: optionalText(254),
  note: optionalText(500),
})

export type AdminCreateOrderLinkBody = z.infer<typeof AdminCreateOrderLink>
