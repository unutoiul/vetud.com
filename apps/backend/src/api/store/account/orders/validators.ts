import { z } from "@medusajs/framework/zod"

export const CustomerOrderQuery = z.object({}).strict()

export const CustomerOrdersQuery = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(20).default(10),
}).strict()
