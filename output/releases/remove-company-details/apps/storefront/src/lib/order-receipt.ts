import type { HttpTypes } from "@medusajs/types"
import type { CustomerOrder } from "./orders"

/** This is an offline receipt, never evidence that a payment succeeded. */
export function serializeOrderReceipt(order: HttpTypes.StoreOrder, customerId?: string) {
  if (!customerId) return null
  const address = order.shipping_address
  const snapshot = {
    id: order.id, display_id: order.display_id, custom_display_id: order.custom_display_id,
    email: order.email, created_at: order.created_at, currency_code: order.currency_code,
    total: order.total, item_total: order.item_total, shipping_total: order.shipping_total,
    tax_total: order.tax_total, discount_total: order.discount_total,
    items: order.items?.map((item) => ({
      id: item.id, title: item.title, product_title: item.product_title,
      variant_title: item.variant_title, quantity: item.quantity, unit_price: item.unit_price,
    })),
    shipping_address: address ? {
      first_name: address.first_name, last_name: address.last_name,
      address_1: address.address_1, address_2: address.address_2, city: address.city,
      postal_code: address.postal_code, province: address.province, country_code: address.country_code,
    } : null,
    shipping_methods: order.shipping_methods?.map(({ name }) => ({ name })),
  }
  return JSON.stringify({ version: 1, customer_id: customerId, order: snapshot })
}

export function parseOrderReceipt(raw: string | null, orderId: string, customerId?: string): CustomerOrder | null {
  if (!raw || !customerId) return null
  try {
    const receipt = JSON.parse(raw)
    if (receipt?.version !== 1 || receipt.customer_id !== customerId || receipt.order?.id !== orderId) return null
    // Older/unscoped receipts are intentionally not displayed after an account
    // change. Even a matching receipt remains non-authoritative at confirmation.
    return receipt.order
  } catch {
    return null
  }
}
