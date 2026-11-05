import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

const require = createRequire(import.meta.url)
const { default: StripeProvider } = require("@medusajs/payment-stripe/dist/services/stripe-provider.js")
const { MedusaError } = require("@medusajs/framework/utils")
const configSource = await readFile(new URL("../medusa-config.ts", import.meta.url), "utf8")
const middlewareSource = await readFile(new URL("../src/api/stripe-session.ts", import.meta.url), "utf8")
const storefrontSource = await readFile(new URL("../../storefront/src/lib/stripe.ts", import.meta.url), "utf8")

function load(source, env = {}, requireModule = () => { throw new Error("Unexpected runtime import") }) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  vm.runInNewContext(compiled, { exports: module.exports, module, process: { env, cwd: () => "/test" }, require: requireModule })
  return module.exports
}

function configuration(env = {}) {
  const config = load(configSource, env, name => {
    if (name === "@medusajs/framework/utils") return { loadEnv() {}, defineConfig: value => value, MedusaError }
    if (name === "./src/lib/nmi-config") return { getNmiConfig: () => ({ enabled: false }) }
    if (name === "./src/lib/paygate-config") return { getPaygateConfig: () => ({ enabled: false }) }
    throw new Error(`Unexpected runtime import: ${name}`)
  })
  return config.modules.find(module => module.resolve === "@medusajs/medusa/payment")?.options.providers.find(provider => provider.id === "stripe")
}

const options = configuration({
  STRIPE_API_KEY: "rk_test_synthetic",
  STRIPE_WEBHOOK_SECRET: "whsec_synthetic",
  STRIPE_PAYMENT_METHOD_CONFIGURATION: "pmc_synthetic",
}).options
const { prepareStripeSession } = load(middlewareSource)

test("the card form uses delivery details and ignores legacy separate billing data", () => {
  const { stripeBillingDetails } = load(storefrontSource, {}, () => ({ loadStripe() {} }))
  const cart = { email: "sandbox@example.com", shipping_address: { first_name: "Sandbox", last_name: "Checkout", country_code: "gb", postal_code: "SW1A 1AA" }, billing_address: { country_code: "us" } }
  const billing = stripeBillingDetails(cart)
  assert.equal(billing.address.country, "GB")
  assert.equal(billing.address.postal_code, "SW1A 1AA")
  assert.equal(billing.name, "Sandbox Checkout")
  assert.equal(billing.email, "sandbox@example.com")
  assert.equal(stripeBillingDetails({ shipping_address: cart.shipping_address }).address.country, "GB")
  assert.equal(stripeBillingDetails({ billing_address: cart.billing_address }).address.country, undefined)
})

test("Stripe stays disabled without credentials and live/deployed credentials require deliberate setup", () => {
  assert.equal(configuration(), undefined)
  assert.throws(() => configuration({ STRIPE_API_KEY: "not-a-key" }), /restricted or secret/)
  assert.throws(() => configuration({ STRIPE_API_KEY: "rk_live_synthetic" }), /not a test-mode key/)
  assert.throws(() => configuration({ STRIPE_API_KEY: "rk_live_synthetic", STRIPE_ENVIRONMENT: "live" }), /WEBHOOK_SECRET/)
  assert.throws(() => configuration({ STRIPE_API_KEY: "rk_test_synthetic", NODE_ENV: "production" }), /WEBHOOK_SECRET/)
  assert.equal(configuration({ STRIPE_API_KEY: "rk_live_synthetic", STRIPE_ENVIRONMENT: "live", STRIPE_WEBHOOK_SECRET: "whsec_synthetic" }).options.capture, false)
})

test("untrusted shopper intent settings cannot change capture, confirmation, customer or payment methods", async () => {
  const req = { body: { provider_id: "pp_stripe_stripe", data: {
    capture_method: "automatic", confirm: true, payment_method: "pm_attacker",
    payment_method_configuration: "pmc_attacker", metadata: { session_id: "payses_attacker" },
    automatic_payment_methods: { enabled: true, allow_redirects: "always" },
  } } }
  let continued = false
  prepareStripeSession(req, {}, () => { continued = true })
  assert.equal(continued, true)
  assert.equal(req.validatedBody, req.body)

  const provider = new StripeProvider({}, options)
  let request
  provider.stripe_.paymentIntents.create = async (params, context) => {
    request = { params, context }
    return { id: "pi_synthetic", status: "requires_payment_method", client_secret: "pi_synthetic_secret_test" }
  }
  const result = await provider.initiatePayment({
    amount: 688.25, currency_code: "usd", data: { ...req.body.data, session_id: "payses_legitimate" },
    context: { idempotency_key: "checkout-legitimate", account_holder: { data: { id: "cus_legitimate" } } },
  })
  assert.equal(result.status, "pending")
  assert.equal(request.params.amount, 68825)
  assert.equal(request.params.currency, "usd")
  assert.equal(request.params.customer, "cus_legitimate")
  assert.equal(request.params.capture_method, "manual")
  assert.equal(request.params.confirm, undefined)
  assert.equal(request.params.payment_method, undefined)
  assert.equal(request.params.payment_method_types, undefined)
  assert.equal(request.params.payment_method_configuration, "pmc_synthetic")
  assert.equal(request.params.automatic_payment_methods.allow_redirects, "never")
  assert.equal(request.params.metadata.session_id, "payses_legitimate")
  assert.equal(request.context.idempotencyKey, "checkout-legitimate")
})

test("Stripe session preparation leaves other payment providers intact", () => {
  const req = { body: { provider_id: "pp_makepay_makepay", data: { return_state: "original" } } }
  prepareStripeSession(req, {}, () => {})
  assert.deepEqual(req.body.data, { return_state: "original" })
  assert.equal(req.validatedBody, undefined)
})

test("3-D Secure, declines and authorization map to the Medusa payment states", () => {
  const provider = new StripeProvider({}, options)
  assert.equal(provider.getStatus({ status: "requires_action" }).status, "requires_more")
  assert.equal(provider.getStatus({ status: "requires_payment_method", last_payment_error: { code: "card_declined" } }).status, "error")
  assert.equal(provider.getStatus({ status: "requires_capture" }).status, "authorized")
  assert.equal(provider.getStatus({ status: "succeeded" }).status, "captured")
})

test("capture and partial refund use the same intent with idempotency and correct currency units", async () => {
  const provider = new StripeProvider({}, options)
  provider.stripe_.paymentIntents.capture = async (id, context) => {
    assert.equal(id, "pi_synthetic")
    assert.equal(context.idempotencyKey, "capture-synthetic")
    return { id, status: "succeeded" }
  }
  provider.stripe_.refunds.create = async (params, context) => {
    assert.equal(params.payment_intent, "pi_synthetic")
    assert.equal(params.amount, 1250)
    assert.equal(context.idempotencyKey, "refund-synthetic")
    return { id: "re_synthetic" }
  }
  const captured = await provider.capturePayment({ data: { id: "pi_synthetic" }, context: { idempotency_key: "capture-synthetic" } })
  assert.equal(captured.data.status, "succeeded")
  await provider.refundPayment({ amount: 12.5, data: { id: "pi_synthetic", currency: "eur" }, context: { idempotency_key: "refund-synthetic" } })
})

test("only correctly signed webhooks for a Medusa session update payment state", async () => {
  const provider = new StripeProvider({}, options)
  const payload = JSON.stringify({
    id: "evt_synthetic", type: "payment_intent.amount_capturable_updated",
    data: { object: { id: "pi_synthetic", currency: "usd", amount_capturable: 68825, metadata: { session_id: "payses_legitimate" } } },
  })
  const signed = (raw, secret = options.webhookSecret) => ({
    rawData: raw, data: JSON.parse(raw),
    headers: { "stripe-signature": provider.stripe_.webhooks.generateTestHeaderString({ payload: raw, secret }) },
  })
  const result = await provider.getWebhookActionAndData(signed(payload))
  assert.equal(result.action, "authorized")
  assert.equal(result.data.session_id, "payses_legitimate")
  assert.equal(result.data.amount, 688.25)
  await assert.rejects(() => provider.getWebhookActionAndData(signed(payload, "whsec_wrong")), /constructWebhookEvent/)
  const tampered = signed(payload)
  tampered.rawData = payload.replace("68825", "1")
  await assert.rejects(() => provider.getWebhookActionAndData(tampered), /constructWebhookEvent/)
  const unrelated = JSON.parse(payload)
  unrelated.data.object.metadata = {}
  assert.equal((await provider.getWebhookActionAndData(signed(JSON.stringify(unrelated)))).action, "not_supported")
})
