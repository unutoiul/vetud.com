import { z } from "@medusajs/framework/zod"

const money = z.number().min(0).max(10_000_000)
const text = (max: number) => z.string().trim().min(1).max(max)
const optionalText = (max: number) => z.string().trim().max(max).nullish()

export const BeslimnowOrderSchema = z.object({
  order_number: text(40),
  placed_at: z.iso.datetime({ offset: true }),
  product: z.enum(["tz2", "retatrutide"]),
  strength: z.enum(["20mg", "40mg"]),
  quantity: z.number().int().min(1).max(100),
  currency: z.string().regex(/^[A-Z]{3}$/),
  unit_regular: money,
  unit_price: money,
  regular_total: money,
  subtotal: money,
  code_discount: money,
  total: money,
  promo_code: optionalText(40),
  name: text(200),
  // As loose as the page's own check, so an order it accepted is never refused here.
  email: z
    .string()
    .trim()
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+$/),
  phone: text(40),
  contact_app: text(40),
  contact_handle: optionalText(120),
  country: z.string().regex(/^[A-Z]{2}$/),
  address: text(500),
  city: text(120),
  postal_code: text(40),
  note: optionalText(2000),
  research_use_confirmed: z.boolean(),
  confirmation_sent: z.boolean(),
})

export type BeslimnowOrderBody = z.infer<typeof BeslimnowOrderSchema>
