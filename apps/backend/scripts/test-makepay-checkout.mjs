import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"
import MakePayProviderService from "../node_modules/@makecrypto/medusa-plugin-makepay/.medusa/server/src/providers/makepay/services/makepay-provider.js"

const backendSource = await readFile(new URL("../medusa-config.ts", import.meta.url), "utf8")
const storefrontSource = await readFile(new URL("../../storefront/src/lib/makepay.ts", import.meta.url), "utf8")

function load(source, env, requireModule = () => { throw new Error("Unexpected runtime import") }) {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const testModule = { exports: {} }
  vm.runInNewContext(compiled, {
    exports: testModule.exports, module: testModule, URL,
    process: { env, cwd: () => "/test" }, require: requireModule,
  })
  return testModule.exports
}

function configuration(origin) {
  const backend = load(backendSource, {
    MAKEPAY_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64"),
    MEDUSA_BACKEND_URL: "https://api.vetud.example",
    STOREFRONT_URL: "https://vetud.example",
    ...(origin ? { MAKEPAY_CHECKOUT_ORIGIN: origin } : {}),
  }, name => {
    if (name === "@medusajs/framework/utils") return { loadEnv() {}, defineConfig: value => value }
    if (name === "./src/lib/nmi-config") return { getNmiConfig: () => ({ enabled: false }) }
    if (name === "./src/lib/paygate-config") return { getPaygateConfig: () => ({ enabled: false }) }
    throw new Error(`Unexpected runtime import: ${name}`)
  })
  const options = backend.plugins.find(plugin => plugin.resolve === "@makecrypto/medusa-plugin-makepay").options
  const payment = backend.modules.find(module => module.resolve === "@medusajs/medusa/payment")
  assert.equal(payment.options.providers[0].options, options)
  const provider = new MakePayProviderService({
    makepayIntegration: { authMode: "oauth", providerId: "makepay", registerPaymentProviderConfiguration() {} },
  }, options)
  const frontend = load(storefrontSource, origin ? { NEXT_PUBLIC_MAKEPAY_CHECKOUT_ORIGIN: origin } : {})
  return { provider, frontend }
}

const expected = {
  uid: "test-payment-uid", amount: "712.95", currency: "USD", sessionId: "payses_test",
  companyId: "company_test", installationId: "installation_test",
}

// Shape returned by MakePay's authenticated payment-link API, with synthetic identities.
function response(origin = "https://pay.makecrypto.io") {
  return {
    companyId: expected.companyId,
    paymentLink: {
      uid: expected.uid, status: "active", amount: expected.amount, fiatCurrency: expected.currency,
      publicUrl: `${origin}/payment/${expected.uid}`,
      metadata: {
        medusaSessionId: expected.sessionId, medusaProviderId: "makepay",
        medusaInstallationId: expected.installationId,
      },
    },
  }
}

function cart(url) {
  return { payment_collection: { payment_sessions: [{ provider_id: "pp_makepay_makepay", data: {
    next_action: { type: "redirect", url }, return_state: "opaque-test-state",
  } }] } }
}

test("the current official checkout URL passes backend correlation and storefront navigation", () => {
  const { provider, frontend } = configuration()
  const snapshot = provider.assertPaymentLinkSnapshot(response(), expected)
  const redirect = frontend.readMakePayRedirect(cart(snapshot.paymentLink.publicUrl))
  assert.equal(redirect.url, "https://pay.makecrypto.io/payment/test-payment-uid")
  assert.equal(redirect.returnState, "opaque-test-state")
})

test("correcting the origin preserves company, session, installation, currency and amount checks", () => {
  const { provider } = configuration()
  for (const mutate of [
    value => { value.companyId = "other-company" },
    value => { value.paymentLink.uid = "other-link" },
    value => { value.paymentLink.amount = "1" },
    value => { value.paymentLink.fiatCurrency = "EUR" },
    value => { value.paymentLink.metadata.medusaSessionId = "payses_other" },
    value => { value.paymentLink.metadata.medusaInstallationId = "other-installation" },
    value => { value.paymentLink.metadata.medusaProviderId = "other-provider" },
    value => { value.paymentLink.publicUrl = "https://attacker.example/payment/test-payment-uid" },
  ]) {
    const value = response()
    mutate(value)
    assert.throws(() => provider.assertPaymentLinkSnapshot(value, expected), /correlation failed/)
  }
})

test("the storefront continues to reject untrusted origins and incomplete sessions", () => {
  const { frontend } = configuration()
  for (const url of [
    "https://attacker.example/payment/test-payment-uid",
    "https://pay.makecrypto.io.attacker.example/payment/test-payment-uid",
    "http://pay.makecrypto.io/payment/test-payment-uid",
  ]) assert.throws(() => frontend.readMakePayRedirect(cart(url)), /unexpected address/)
  const incomplete = cart("https://pay.makecrypto.io/payment/test-payment-uid")
  delete incomplete.payment_collection.payment_sessions[0].data.return_state
  assert.throws(() => frontend.readMakePayRedirect(incomplete), /could not be prepared/)
})

test("a deliberate environment override must match on the backend and storefront", () => {
  const { provider, frontend } = configuration("https://checkout.sandbox.example")
  const snapshot = provider.assertPaymentLinkSnapshot(response("https://checkout.sandbox.example"), expected)
  assert.equal(frontend.readMakePayRedirect(cart(snapshot.paymentLink.publicUrl)).url,
    "https://checkout.sandbox.example/payment/test-payment-uid")
  assert.throws(() => provider.assertPaymentLinkSnapshot(response(), expected), /correlation failed/)
  assert.throws(() => frontend.readMakePayRedirect(cart(response().paymentLink.publicUrl)), /unexpected address/)
})
