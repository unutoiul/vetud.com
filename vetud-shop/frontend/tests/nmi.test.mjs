import assert from "node:assert/strict"
import { test } from "node:test"
import { NMI_PROVIDER_ID, confirmationPayment, nmiAvailable, nmiCartFingerprint, readNmiSession } from "../src/lib/nmi.ts"

const cart = () => ({ id: "cart_unit", currency_code: "usd", total: 75.5, email: "unit@example.test",
  billing_address: { address_1: "Test street", first_name: "Test" }, shipping_address: { address_1: "Test street" },
  items: [{ id: "item_unit", quantity: 1, unit_price: 75.5 }],
  payment_collection: { payment_sessions: [{ id: "payses_unit", provider_id: NMI_PROVIDER_ID,
    data: { tokenizationKey: "public-key", sandbox: true, amount: 75.5, currency_code: "usd", merchant_country: "US", ach_enabled: true } }] } })

test("NMI is hidden unless configured for the actual cart currency", () => {
  assert.equal(nmiAvailable(null, "usd"), false)
  assert.equal(nmiAvailable({ enabled: false, currency_code: "usd" }, "usd"), false)
  assert.equal(nmiAvailable({ enabled: true, currency_code: "usd" }, "eur"), false)
  assert.equal(nmiAvailable({ enabled: true, currency_code: "usd" }, "usd"), true)
})

test("hosted fields require an explicit environment, matching amount/currency and merchant country", () => {
  assert.deepEqual(readNmiSession(cart()), { id: "payses_unit", tokenizationKey: "public-key", sandbox: true, amount: 75.5, currency: "USD", country: "US", ach: true })
  for (const change of [{ sandbox: undefined }, { sandbox: "false" }, { amount: 1 }, { currency_code: "eur" }, { merchant_country: "" }, { tokenizationKey: "" }]) {
    const value = cart()
    Object.assign(value.payment_collection.payment_sessions[0].data, change)
    assert.equal(readNmiSession(value), null)
  }
})

test("changes to price, billing, delivery, email and quantity invalidate the reviewed checkout", () => {
  const original = cart()
  const signature = nmiCartFingerprint(original)
  for (const change of [{ total: 76 }, { email: "changed@example.test" }, { billing_address: { address_1: "Another street" } }, { shipping_address: { address_1: "Elsewhere" } }, { items: [{ id: "item_unit", quantity: 2, unit_price: 75.5 }] }]) {
    assert.notEqual(nmiCartFingerprint({ ...original, ...change }), signature)
  }
  assert.equal(nmiCartFingerprint({ ...original, billing_address: { first_name: "Test", address_1: "Test street" } }), signature)
})

const order = (provider, method = "card", status = "authorized") => ({ payment_status: status, payment_summary: {
  method: provider === NMI_PROVIDER_ID ? (method === "ach" ? "nmi_ach" : "nmi_card") : provider === "pp_system_default" ? "manual" : "online",
} })

test("authorized cards and unsettled bank debits never receive bank transfer instructions", () => {
  assert.deepEqual(confirmationPayment(order(NMI_PROVIDER_ID)).manual, false)
  assert.match(confirmationPayment(order(NMI_PROVIDER_ID)).message, /card payment is authorized/)
  assert.match(confirmationPayment(order(NMI_PROVIDER_ID, "ach")).message, /awaiting settlement/)
  assert.equal(confirmationPayment(order(NMI_PROVIDER_ID, "ach")).paid, false)
  assert.equal(confirmationPayment(order("pp_makepay_makepay")).manual, false)
})

test("only authoritative captured payments are shown as paid, never a URL or cached flag", () => {
  assert.equal(confirmationPayment({ ...order(NMI_PROVIDER_ID), paid: "1" }).paid, false)
  assert.equal(confirmationPayment(order(NMI_PROVIDER_ID, "card", "captured")).paid, true)
  assert.equal(confirmationPayment(order(NMI_PROVIDER_ID, "card", "captured"), false).paid, false)
  assert.equal(confirmationPayment(order("pp_system_default"), false).manual, false)
  assert.equal(confirmationPayment(order("pp_system_default")).manual, true)
  assert.equal(confirmationPayment(order("pp_system_default", "card", "refunded")).manual, false)
})

test("an ACH return hold overrides an old captured status", () => {
  const value = order(NMI_PROVIDER_ID, "ach", "captured")
  value.payment_summary.review = "returned"
  assert.equal(confirmationPayment(value).paid, false)
  assert.match(confirmationPayment(value).message, /needs review/)
})

test("missing safe summaries and unresolved bank payments cannot claim payment success", () => {
  assert.equal(confirmationPayment({ payment_status: "captured" }).paid, false)
  for (const review of ["pending_settlement", "requires_review", "canceled"]) {
    const value = order(NMI_PROVIDER_ID, "ach", "captured")
    value.payment_summary.review = review
    assert.equal(confirmationPayment(value).paid, false)
    assert.equal(confirmationPayment(value).manual, false)
  }
})
