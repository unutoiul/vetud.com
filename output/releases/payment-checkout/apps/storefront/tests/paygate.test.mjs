import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"
import vm from "node:vm"
import ts from "typescript"

const source = await readFile(new URL("../src/lib/paygate.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const testModule = { exports: {} }
vm.runInNewContext(compiled, { exports: testModule.exports, module: testModule, URL, require: name => {
  assert.equal(name, "./config")
  return { MEDUSA_BACKEND_URL: "https://api.vetud.example" }
} })
const { readPaygateRedirect, paygateOrderLink, PAYGATE_CARD } = testModule.exports
const cart = () => ({ total: 100, currency_code: "usd", payment_collection: { payment_sessions: [{
  id: "payses_1", provider_id: PAYGATE_CARD, data: { paygate: { session_id: "payses_1", amount: "100", currency: "USD", redirect_token: "a".repeat(64), canceled: false, checkout_url: "https://attacker.example" } },
}] } })

test("PayGate navigation uses the configured backend, never a payment-data origin", () => {
  const target = new URL(readPaygateRedirect(cart()).url)
  assert.equal(target.origin, "https://api.vetud.example")
  assert.equal(target.pathname, "/paygate/checkout/payses_1")
})
test("a changed total, currency, identity, token or canceled session blocks checkout", () => {
  for (const mutate of [
    value => { value.total = 101 },
    value => { value.currency_code = "eur" },
    value => { value.payment_collection.payment_sessions[0].id = "payses_other" },
    value => { value.payment_collection.payment_sessions[0].data.paygate.redirect_token = "bad" },
    value => { value.payment_collection.payment_sessions[0].data.paygate.canceled = true },
  ]) {
    const value = cart()
    mutate(value)
    assert.throws(() => readPaygateRedirect(value), /changed/)
  }
})
test("order-history recovery links must target the configured backend's payment route", () => {
  const path = `/paygate/checkout/payses_1?token=${"a".repeat(64)}`
  assert.equal(paygateOrderLink(`https://api.vetud.example${path}`), `https://api.vetud.example${path}`)
  assert.equal(paygateOrderLink(`https://attacker.example${path}`), null)
  assert.equal(paygateOrderLink("javascript:alert(1)"), null)
  assert.equal(paygateOrderLink("https://api.vetud.example/admin"), null)
})
