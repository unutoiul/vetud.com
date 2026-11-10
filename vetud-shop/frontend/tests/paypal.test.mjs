import assert from "node:assert/strict"
import { test } from "node:test"
import { isPayPalReturnForCart, PAYPAL_PROVIDER_ID, payPalAvailable, payPalCartFingerprint } from "../src/lib/paypal.ts"

const checkout = (data = {}, cart = {}) => ({
  id: "cart_1", currency_code: "gbp", total: 42.5,
  payment_collection: { payment_sessions: [{ provider_id: PAYPAL_PROVIDER_ID, amount: 42.5, currency_code: "gbp", data: { paypal: { order_id: "PAYPAL1" }, ...data } }] },
  ...cart,
})

test("PayPal is hidden for a disconnected, disabled, sandbox-production or wrong-currency account", () => {
  const config = { client_id: "public-client-id", environment: "live", currency: "GBP", currency_supported: true, paypal_enabled: true }
  assert.equal(payPalAvailable(config, "gbp", false), true)
  assert.equal(payPalAvailable(null, "gbp", false), false)
  for (const change of [{ client_id: "" }, { paypal_enabled: false }, { currency_supported: false }, { currency: "USD" }, { environment: "sandbox" }]) assert.equal(payPalAvailable({ ...config, ...change }, "gbp", false), false)
  assert.equal(payPalAvailable({ ...config, environment: "sandbox" }, "gbp", true), true)
})

test("return URLs cannot complete a manual, unrelated or changed cart", () => {
  assert.equal(isPayPalReturnForCart(checkout(), "PAYPAL1"), true)
  assert.equal(isPayPalReturnForCart(checkout(), null), false)
  assert.equal(isPayPalReturnForCart(checkout(), "OTHER"), false)
  assert.equal(isPayPalReturnForCart(checkout({}, { payment_collection: { payment_sessions: [{ provider_id: "pp_system_default" }] } }), "PAYPAL1"), false)
  assert.equal(isPayPalReturnForCart(checkout({}, { total: 1 }), "PAYPAL1"), false)
  assert.equal(isPayPalReturnForCart(checkout({}, { currency_code: "usd" }), "PAYPAL1"), false)
  assert.equal(isPayPalReturnForCart(checkout({ paypal: { order_id: "OTHER" } }), "PAYPAL1"), false)
  assert.equal(isPayPalReturnForCart(checkout({}, { total: 0 }), "PAYPAL1"), false)
})

test("approval cannot be reused after changing an account, address, currency, delivery or item", () => {
  const cart = { ...checkout(), customer_id: "cus_1", shipping_address: { address_1: "1 Road" }, items: [{ id: "item_1", quantity: 1, unit_price: 42.5 }], shipping_methods: [{ shipping_option_id: "ship_1", amount: 0 }] }
  const fingerprint = payPalCartFingerprint(cart)
  for (const change of [{ customer_id: "cus_2" }, { total: 50 }, { currency_code: "eur" }, { shipping_address: { address_1: "2 Road" } }, { items: [{ id: "item_1", quantity: 2, unit_price: 42.5 }] }, { shipping_methods: [{ shipping_option_id: "ship_2", amount: 0 }] }]) assert.notEqual(payPalCartFingerprint({ ...cart, ...change }), fingerprint)
  assert.equal(payPalCartFingerprint({ ...cart, shipping_address: { ...cart.shipping_address, updated_at: "changed" } }), fingerprint)
})
