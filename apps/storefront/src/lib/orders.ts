import type { HttpTypes } from "@medusajs/types"

export type ShipmentLabel = { tracking_number?: string | null; tracking_url?: string | null }
export type OrderShipment = {
  id: string
  packed_at?: string | Date | null
  shipped_at?: string | Date | null
  delivered_at?: string | Date | null
  canceled_at?: string | Date | null
  labels?: ShipmentLabel[] | null
}
export type CustomerOrder = Omit<HttpTypes.StoreOrder, "fulfillments"> & { fulfillments?: OrderShipment[] }
export type CustomerOrdersResponse = { orders: CustomerOrder[]; count: number; offset: number; limit: number }

export function orderNumber(order: Pick<CustomerOrder, "id" | "display_id" | "custom_display_id">) {
  return order.custom_display_id || (order.display_id != null ? `#${order.display_id}` : order.id)
}

export function paymentLabel(status: string) {
  const labels: Record<string, string> = {
    not_paid: "Awaiting payment", awaiting: "Awaiting payment", authorized: "Payment authorized",
    partially_authorized: "Partially authorized", captured: "Paid", partially_captured: "Partially paid",
    partially_refunded: "Partially refunded", refunded: "Refunded", canceled: "Payment canceled",
    requires_action: "Payment needs attention",
  }
  return labels[status] ?? "Payment processing"
}

export function deliveryLabel(order: Pick<CustomerOrder, "status" | "fulfillment_status">) {
  if (order.status === "canceled") return "Order canceled"
  const labels: Record<string, string> = {
    not_fulfilled: "Processing", partially_fulfilled: "Partially packed", fulfilled: "Packed",
    partially_shipped: "Partially shipped", shipped: "Shipped", partially_delivered: "Partially delivered",
    delivered: "Delivered", canceled: "Shipment canceled",
  }
  return labels[order.fulfillment_status] ?? "Processing"
}

export function shipmentLabel(shipment: OrderShipment) {
  if (shipment.canceled_at) return "Canceled"
  if (shipment.delivered_at) return "Delivered"
  if (shipment.shipped_at) return "Shipped"
  return "Preparing shipment"
}

export function normalizeTrackingNumber(value: string) {
  const cleaned = value.replace(/\s/g, "")
  return /^[A-Za-z0-9-]{5,50}$/.test(cleaned) ? cleaned : ""
}

/** Carrier data is untrusted. Never render script URLs or credential-bearing links. */
export function trackingLink(label: ShipmentLabel): { href: string; external: boolean } | null {
  if (label.tracking_url) {
    try {
      const url = new URL(label.tracking_url)
      if (["https:", "http:"].includes(url.protocol) && !url.username && !url.password) {
        return { href: url.href, external: true }
      }
    } catch {
      // An absent/invalid carrier URL can still be tracked using its parcel number.
    }
  }
  const number = normalizeTrackingNumber(label.tracking_number ?? "")
  return number ? { href: `/tracking?number=${encodeURIComponent(number)}`, external: false } : null
}

export function activeShipments(order: Pick<CustomerOrder, "fulfillments">) {
  return (order.fulfillments ?? []).filter((shipment) => !shipment.canceled_at)
}
