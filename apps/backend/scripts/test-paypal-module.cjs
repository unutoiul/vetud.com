const { test } = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const root = path.dirname(require.resolve("@easypayment/medusa-payment-paypal/package.json"))
const { default: WalletProvider } = require(path.join(root, ".medusa/server/src/modules/paypal/payment-provider/service.js"))
const { GET: getConfig } = require(path.join(root, ".medusa/server/src/api/store/paypal/config/route.js"))
const { POST: createOrder } = require(path.join(root, ".medusa/server/src/api/store/paypal/create-order/route.js"))
const { default: PayPalService } = require(path.join(root, ".medusa/server/src/modules/paypal/service.js"))

test("pinned PayPal module keeps GBP, EUR and USD from the Medusa cart through session, config and order creation", async () => {
  const previousMode = process.env.PAYPAL_MULTI_CURRENCY
  const previousFetch = global.fetch
  process.env.PAYPAL_MULTI_CURRENCY = "true"
  try {
    const provider = new WalletProvider({ __pg_connection__: () => {} }, {})
    provider.resolveSettings = async () => ({ apiDetails: { currency_code: "EUR" } })
    for (const currency of ["GBP", "EUR", "USD"]) {
      const session = await provider.initiatePayment({ currency_code: currency.toLowerCase(), amount: 42.5 })
      assert.equal(session.data.currency_code, currency)
      const paypal = {
        getActiveCredentials: async () => ({ environment: "sandbox", client_id: "public-test-id" }),
        getApiDetails: async () => ({ apiDetails: { currency_code: "EUR" } }),
        getSettings: async () => ({ data: { api_details: { currency_code: "EUR" }, advanced_card_payments: { enabled: false } } }),
        getAppAccessToken: async () => "test-token",
      }
      const cart = { id: "cart_paypal_module_test", currency_code: currency.toLowerCase(), total: 42.5, subtotal: 42.5, item_subtotal: 42.5, shipping_subtotal: 0, tax_total: 0, discount_total: 0, items: [] }
      const req = {
        query: { cart_id: cart.id }, body: { cart_id: cart.id }, headers: {},
        scope: { resolve: key => key === "paypal_onboarding" ? paypal : key === "query" ? { graph: async () => ({ data: [cart] }) } : key === "configModule" ? { projectConfig: { http: { storeCors: "http://localhost:8000" } } } : { info: () => {}, debug: () => {}, warn: () => {}, error: console.error } },
      }
      let result
      let status = 200
      const res = { status: value => { status = value; return res }, json: value => { result = value; return res } }
      await getConfig(req, res)
      assert.equal(result.currency, currency)
      assert.equal(result.currency_supported, true)
      global.fetch = async (_url, init) => {
        const body = JSON.parse(init.body)
        assert.equal(body.purchase_units[0].amount.currency_code, currency)
        assert.equal(body.purchase_units[0].amount.value, "42.50")
        return new Response(JSON.stringify({ id: "PAYPAL123456", status: "CREATED" }), { status: 201 })
      }
      await createOrder(req, res)
      assert.equal(status, 200, JSON.stringify(result))
      assert.equal(result.id, "PAYPAL123456")
    }
  } finally {
    global.fetch = previousFetch
    if (previousMode === undefined) delete process.env.PAYPAL_MULTI_CURRENCY
    else process.env.PAYPAL_MULTI_CURRENCY = previousMode
  }
})

test("webhook registration excludes the two event names rejected by PayPal's Live API", async () => {
  const previousFetch = global.fetch
  let saved
  try {
    global.fetch = async (_url, init) => {
      if (init.method !== "POST") return new Response(JSON.stringify({ webhooks: [] }), { status: 200 })
      const body = JSON.parse(init.body)
      const names = body.event_types.map(event => event.name)
      assert.equal(names.length, 9)
      assert.ok(names.includes("PAYMENT.CAPTURE.COMPLETED"))
      assert.ok(names.includes("PAYMENT.CAPTURE.REFUNDED"))
      assert.ok(!names.includes("CHECKOUT.ORDER.CANCELLED"))
      assert.ok(!names.includes("PAYMENT.AUTHORIZATION.DENIED"))
      return new Response(JSON.stringify({ id: "WEBHOOK123" }), { status: 201 })
    }
    const result = await PayPalService.prototype.ensureWebhookRegistration.call({
      getCurrentEnvironment: async () => "live",
      ensureSettingsDefaults: async () => ({ apiDetails: {} }),
      getAppAccessToken: async () => "test-token",
      resolveWebhookUrl: async () => "https://backend.example/hooks/paypal/webhook",
      isLocalWebhookUrl: () => false,
      saveSettings: async value => { saved = value },
      recordAuditEvent: async () => {},
    })
    assert.equal(result, "WEBHOOK123")
    assert.equal(saved.api_details.webhook_ids.live, "WEBHOOK123")
  } finally { global.fetch = previousFetch }
})
