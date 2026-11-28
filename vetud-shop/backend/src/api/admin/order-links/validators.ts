import { z } from "@medusajs/framework/zod"

const optionalText = (max: number) => z.string().trim().max(max).optional()
const required = (max: number, message: string) => z.string().trim().min(1, message).max(max)

/**
 * Where the order goes. With it (and an email), the customer's checkout opens at payment: they only
 * check the details and pay (owner, 2026-11-25).
 */
const ShippingAddress = z.object({
  first_name: required(120, "Enter the customer's first name."),
  last_name: required(120, "Enter the customer's last name."),
  company: optionalText(160),
  address_1: required(240, "Enter the street address."),
  address_2: optionalText(240),
  city: required(120, "Enter the city."),
  province: optionalText(80),
  postal_code: required(24, "Enter the postal code."),
  country_code: z
    .string()
    .regex(/^[A-Za-z]{2}$/)
    .transform((code) => code.toLowerCase()),
  phone: required(40, "Enter a phone number for the courier."),
})

/** POST /admin/order-links: the items and (optionally) who the link is for and where it goes. */
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
  email: z.email("Enter a valid email address.").max(254).optional(),
  shipping_address: ShippingAddress.optional(),
  /**
   * The payment method already chosen when the customer opens the checkout. They can still pick
   * another one, e.g. after a declined card (owner, 2026-11-25).
   */
  payment_provider: z
    .string()
    .trim()
    .regex(/^pp_[A-Za-z0-9_-]{1,100}$/, "Choose a payment method from the list.")
    .optional(),
  note: optionalText(500),
})

export type AdminCreateOrderLinkBody = z.infer<typeof AdminCreateOrderLink>
