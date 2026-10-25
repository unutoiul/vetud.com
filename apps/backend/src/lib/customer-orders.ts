import { MedusaError } from "@medusajs/framework/utils"

export type CustomerOrdersInput = {
  customer_id: string
  offset: number
  limit: number
}

// Deliberately fixed: callers cannot expand payment data, internal metadata or
// other customers through the order graph. Labels are not exposed by the native
// Store order field allowlist in our Medusa version.
const CUSTOMER_ORDER_FIELDS = [
  "id", "display_id", "custom_display_id", "created_at", "status", "email",
  "currency_code", "total", "item_total", "shipping_total", "tax_total", "discount_total",
  "items.id", "items.title", "items.product_title", "items.variant_title",
  "items.quantity", "items.unit_price", "items.total",
  "shipping_address.first_name", "shipping_address.last_name", "shipping_address.company",
  "shipping_address.address_1", "shipping_address.address_2", "shipping_address.city",
  "shipping_address.province", "shipping_address.postal_code", "shipping_address.country_code",
  "shipping_methods.name",
  "fulfillments.id", "fulfillments.packed_at", "fulfillments.shipped_at",
  "fulfillments.delivered_at", "fulfillments.canceled_at",
  "fulfillments.labels.tracking_number", "fulfillments.labels.tracking_url",
]

export function customerOrderQuery(input: CustomerOrdersInput) {
  // Fail closed even if this workflow is called outside the authenticated route.
  if (!input.customer_id?.trim()) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to view your orders.")
  }
  if (!Number.isInteger(input.offset) || input.offset < 0 ||
      !Number.isInteger(input.limit) || input.limit < 1 || input.limit > 20) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid order pagination.")
  }

  return {
    fields: CUSTOMER_ORDER_FIELDS,
    variables: {
      filters: { customer_id: input.customer_id, is_draft_order: false },
      skip: input.offset,
      take: input.limit,
      order: { created_at: "DESC", id: "DESC" },
    },
  }
}
