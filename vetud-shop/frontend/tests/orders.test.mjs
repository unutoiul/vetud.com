import assert from "node:assert/strict"
import { test } from "node:test"
import { activeShipments, deliveryLabel, normalizeTrackingNumber, orderNumber, orderPaymentLabel, orderPaymentNotice, paymentLabel, shipmentLabel, trackingLink } from "../src/lib/orders.ts"
import { parseOrderReceipt, serializeOrderReceipt } from "../src/lib/order-receipt.ts"

test("order numbering preserves custom references and zero display IDs", () => {
  assert.equal(orderNumber({ id: "order_1", display_id: 0 }), "#0")
  assert.equal(orderNumber({ id: "order_1", display_id: 8, custom_display_id: "VT-8" }), "VT-8")
})

test("partial fulfillment and cancellation are not presented as fully shipped", () => {
  assert.equal(deliveryLabel({ status: "pending", fulfillment_status: "partially_shipped" }), "Partially shipped")
  assert.equal(deliveryLabel({ status: "pending", fulfillment_status: "partially_delivered" }), "Partially delivered")
  assert.equal(deliveryLabel({ status: "canceled", fulfillment_status: "shipped" }), "Order canceled")
  assert.equal(paymentLabel("partially_refunded"), "Partially refunded")
  assert.equal(paymentLabel("authorized"), "Payment authorized")
})

test("all active shipments are retained, canceled labels are omitted", () => {
  const shipments = [{ id: "old", canceled_at: "2026-01-01" }, { id: "one" }, { id: "two", shipped_at: "2026-01-02" }]
  assert.deepEqual(activeShipments({ fulfillments: shipments }).map(({ id }) => id), ["one", "two"])
  assert.equal(shipmentLabel(shipments[1]), "Preparing shipment")
  assert.equal(shipmentLabel(shipments[2]), "Shipped")
  assert.equal(shipmentLabel({ id: "done", delivered_at: "2026-01-03" }), "Delivered")
})

test("number-only labels link to prefilled tracking without sending data to a carrier", () => {
  assert.deepEqual(trackingLink({ tracking_number: "AB 123456789 GB" }), { href: "/tracking?number=AB123456789GB", external: false })
  assert.equal(normalizeTrackingNumber("<script>"), "")
  assert.equal(normalizeTrackingNumber("A".repeat(51)), "")
  assert.equal(trackingLink({}), null)
})

test("untrusted carrier links cannot execute scripts or include credentials", () => {
  for (const tracking_url of ["javascript:alert(1)", "data:text/html,test", "//evil.example/test", "https://user:password@example.com", "/tracking", "not a URL"]) {
    assert.equal(trackingLink({ tracking_url }), null)
    assert.deepEqual(trackingLink({ tracking_url, tracking_number: "AB12345" }), { href: "/tracking?number=AB12345", external: false })
  }
  assert.deepEqual(trackingLink({ tracking_url: "https://carrier.example/track?id=AB12345" }), { href: "https://carrier.example/track?id=AB12345", external: true })
})

test("pending, returned and unverified payments override the old captured label without hiding tracking", () => {
  for (const [review, label] of [["pending_settlement", "Bank payment processing"], ["returned", "Bank payment returned"], ["requires_review", "Payment needs review"], ["canceled", "Payment canceled"]]) {
    const order = { payment_status: "captured", payment_summary: { method: "nmi_ach", review }, fulfillments: [{ id: "shipment_one", shipped_at: "2026-01-01", labels: [{ tracking_number: "AB12345" }] }] }
    assert.equal(orderPaymentLabel(order), label)
    assert.ok(orderPaymentNotice(order))
    assert.equal(activeShipments(order).length, 1)
  }
  assert.equal(orderPaymentLabel({ payment_status: "refunded", payment_summary: { method: "nmi_ach" } }), "Refunded")
  assert.equal(orderPaymentNotice({ payment_summary: { method: "online" } }), null)
})

test("offline receipts omit gateway data and cannot cross customer or order boundaries", () => {
  const raw = serializeOrderReceipt({ id: "order_one", email: "test@example.test", currency_code: "usd", payment_status: "captured",
    metadata: { secret: "private" }, payment_collections: [{ payments: [{ data: { token: "private" } }] }],
    items: [{ id: "item_one", title: "Sample", metadata: { private: true } }],
    shipping_address: { address_1: "Test street", metadata: { private: true } },
    shipping_methods: [{ name: "Courier", data: { private: true } }],
  }, "cus_A")
  const order = parseOrderReceipt(raw, "order_one", "cus_A")
  assert.equal(order.id, "order_one")
  assert.equal(order.payment_status, undefined)
  assert.equal(order.payment_collections, undefined)
  assert.doesNotMatch(raw, /private|token|metadata|captured/)
  assert.equal(parseOrderReceipt(raw, "order_one", "cus_B"), null)
  assert.equal(parseOrderReceipt(raw, "order_two", "cus_A"), null)
  assert.equal(parseOrderReceipt(raw, "order_one"), null)
  assert.equal(parseOrderReceipt("broken json", "order_one", "cus_A"), null)
  assert.equal(parseOrderReceipt(JSON.stringify({ id: "order_one" }), "order_one", "cus_A"), null)
  assert.equal(serializeOrderReceipt({ id: "order_one" }), null)
})
