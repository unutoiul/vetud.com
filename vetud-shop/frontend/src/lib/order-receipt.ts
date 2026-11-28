import type { HttpTypes } from "@medusajs/types"
import type { CustomerOrder } from "./orders"

/** A receipt belongs to the signed-in member who ordered, or to "guest" for an order without an account. */
export const GUEST_RECEIPT_OWNER = "guest"

/**
 * This is an offline receipt, never evidence that a payment succeeded. A guest's copy also keeps the
 * cart the order came from: that is how this browser proves it placed the order when the guest
 * creates an account from the confirmation page.
 */
export function serializeOrderReceipt(order: HttpTypes.StoreOrder, customerId?: string, cartId?: string) {
  const address = order.shipping_address
  const snapshot = {
    id: order.id,
    display_id: order.display_id,
    custom_display_id: order.custom_display_id,
    email: order.email,
    created_at: order.created_at,
    currency_code: order.currency_code,
    total: order.total,
    item_total: order.item_total,
    item_subtotal: order.item_subtotal,
    shipping_total: order.shipping_total,
    shipping_subtotal: order.shipping_subtotal,
    tax_total: order.tax_total,
    discount_total: order.discount_total,
    items: order.items?.map((item) => ({
      id: item.id,
      title: item.title,
      product_title: item.product_title,
      variant_title: item.variant_title,
      quantity: item.quantity,
      unit_price: item.unit_price,
      thumbnail: item.thumbnail,
      product_handle: item.product_handle,
    })),
    shipping_address: address
      ? {
          first_name: address.first_name,
          last_name: address.last_name,
          company: address.company,
          address_1: address.address_1,
          address_2: address.address_2,
          city: address.city,
          postal_code: address.postal_code,
          province: address.province,
          country_code: address.country_code,
        }
      : null,
    shipping_methods: order.shipping_methods?.map(({ name }) => ({ name })),
  }
  return JSON.stringify({
    version: 1,
    customer_id: customerId || GUEST_RECEIPT_OWNER,
    cart_id: customerId ? null : (cartId ?? null),
    order: snapshot,
  })
}

export function parseOrderReceipt(raw: string | null, orderId: string, customerId?: string): CustomerOrder | null {
  if (!raw) return null
  try {
    const receipt = JSON.parse(raw)
    if (
      receipt?.version !== 1 ||
      receipt.customer_id !== (customerId || GUEST_RECEIPT_OWNER) ||
      receipt.order?.id !== orderId
    )
      return null
    // A receipt is only shown to whoever it belongs to: a member's never appears after an account
    // change, and a guest's is read as a guest's. Even a matching receipt is non-authoritative.
    return receipt.order
  } catch {
    return null
  }
}

/** The cart a guest order came from, or null. */
export function receiptCartId(raw: string | null, orderId: string): string | null {
  try {
    const receipt = JSON.parse(raw ?? "null")
    return receipt?.order?.id === orderId &&
      receipt.customer_id === GUEST_RECEIPT_OWNER &&
      typeof receipt.cart_id === "string"
      ? receipt.cart_id
      : null
  } catch {
    return null
  }
}
