import { z } from "@medusajs/framework/zod"

const text = (max: number) => z.string().trim().max(max).optional()

const Address = z.object({
  first_name: text(120),
  last_name: text(120),
  company: text(160),
  address_1: text(240),
  address_2: text(240),
  city: text(120),
  province: text(80),
  postal_code: text(24),
  country_code: z.string().trim().length(2),
  phone: text(40),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const StoreSetCartDeliveryAddressSchema = z.object({
  shipping_address: Address,
  billing_address: Address.optional(),
})

export type StoreSetCartDeliveryAddressBody = z.infer<typeof StoreSetCartDeliveryAddressSchema>
