import { parseLots } from "../lots"

/**
 * The lot as published in the product's `metadata.lots`, matched without regard to case or
 * spacing, or undefined when the product has no such lot.
 */
export function matchLot(metadataLots: unknown, code: string) {
  const wanted = code.replace(/\s+/g, "").toUpperCase()
  return parseLots(metadataLots).find(lot => lot.lot.replace(/\s+/g, "").toUpperCase() === wanted)?.lot
}

export type OrderForPurchaseCheck = {
  status?: string | null
  is_draft_order?: boolean | null
  items?: ({ product_id?: string | null } | null)[] | null
  payment_collections?: ({ payments?: ({ captured_at?: Date | string | null } | null)[] | null } | null)[] | null
}

/**
 * True when one of the customer's orders contains the product and has been paid. Bank transfers
 * count once the payment is captured in Admin; canceled and draft orders never count.
 */
export function hasPaidOrderFor(orders: OrderForPurchaseCheck[], productId: string) {
  return orders.some(order =>
    order.status !== "canceled"
    && !order.is_draft_order
    && order.items?.some(item => item?.product_id === productId)
    && order.payment_collections?.some(collection => collection?.payments?.some(payment => Boolean(payment?.captured_at)))
  )
}
