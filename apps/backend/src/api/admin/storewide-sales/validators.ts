import { z } from "@medusajs/framework/zod"
import { MAX_PERCENT_OFF, MIN_PERCENT_OFF } from "../../../lib/storewide-sale"

const DateTime = z.iso.datetime({ offset: true }).nullable()

export const AdminCreateStorewideSale = z.strictObject({
  title: z.string().trim().min(1).max(120),
  percent_off: z.number().int().min(MIN_PERCENT_OFF).max(MAX_PERCENT_OFF),
  starts_at: DateTime.default(null),
  ends_at: DateTime.default(null),
  status: z.enum(["active", "draft"]).default("active"),
})

export type AdminCreateStorewideSaleType = z.infer<typeof AdminCreateStorewideSale>

export const AdminUpdateStorewideSale = z.strictObject({
  title: z.string().trim().min(1).max(120).optional(),
  percent_off: z.number().int().min(MIN_PERCENT_OFF).max(MAX_PERCENT_OFF).optional(),
  starts_at: DateTime.optional(),
  ends_at: DateTime.optional(),
  status: z.enum(["active", "draft"]).optional(),
})

export type AdminUpdateStorewideSaleType = z.infer<typeof AdminUpdateStorewideSale>
