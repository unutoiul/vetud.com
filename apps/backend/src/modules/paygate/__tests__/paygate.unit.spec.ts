import { generateKeyPairSync, sign } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { CardApi, CryptoApi, CallbackData, CallbackToken, CallbackVerifier, rawQueryFrom } from "paygate-to"
import { processPaymentWorkflow } from "@medusajs/medusa/core-flows"
import PaygateProvider from "../service"
import { getPaygateConfig, PAYGATE_CARD, PAYGATE_CRYPTO } from "../../../lib/paygate-config"
import { paygateReceipt, readPaygate, sealPaygate } from "../../../lib/paygate-state"
import { guardPaygateFulfillment, preparePaygate, reconcilePaygate } from "../../../workflows/paygate"
import { paymentNotice } from "../../../lib/payment-notice"
import { createPaygateClient } from "../../../lib/paygate-client"

jest.mock("@medusajs/medusa/core-flows", () => ({ processPaymentWorkflow: jest.fn() }))

const merchant = `0x${"1".repeat(40)}`
const deposit = `0x${"2".repeat(40)}`
const other = `0x${"3".repeat(40)}`
const keys = generateKeyPairSync("rsa", { modulusLength: 2048 })
const env = {
  PAYGATE_ENABLED: "true", PAYGATE_CALLBACK_SECRET: "a".repeat(64),
  PAYGATE_CARD_WALLET: merchant, PAYGATE_CRYPTO_WALLETS: JSON.stringify({ evm: merchant }),
  PAYGATE_API_DOMAIN: "api-vetudcom-d02e713a96aaf8526039b988.paygate.to", MEDUSA_BACKEND_URL: "https://api.shop.example",
}
const config = () => getPaygateConfig(env)
const provider = (mode: "card" | "crypto" = "card") => new PaygateProvider({}, { ...config(), mode })
const start = () => provider().initiatePayment({ amount: 100, currency_code: "usd", context: { idempotency_key: "payses_test" }, data: { cart_id: "cart_test", email: "buyer@example.com" } })

function callback(state: { reference: string }, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ reference: state.reference, session: "payses_test", token: new CallbackToken(env.PAYGATE_CALLBACK_SECRET).sign(state.reference), coin: "polygon_usdc", value_coin: "100", value_forwarded_coin: "99", address_out: JSON.stringify({ [merchant]: "1" }), address_in: deposit, txid_in: "tx_1", txid_out: "out_1", ...extra })
  const originalUrl = `/paygate/callback?${params}`
  return { originalUrl, headers: { "x-paygate-key-id": "test", "x-paygate-signature": sign("RSA-SHA256", Buffer.from(`https://api.shop.example${originalUrl}`), keys.privateKey).toString("base64") } }
}

describe("PayGate payment integration", () => {
  let originalEnv: NodeJS.ProcessEnv
  beforeEach(() => {
    originalEnv = { ...process.env }
    Object.assign(process.env, env)
    jest.spyOn(CardApi.prototype, "convertToUsd").mockImplementation(async amount => ({ value: String(amount), exchangeRate: "1" }))
    jest.spyOn(CardApi.prototype, "providers").mockResolvedValue([{ id: "example", name: "Example", active: true, status: "active", minimumAmount: "1", minimumCurrency: "USD" }])
    jest.spyOn(CardApi.prototype, "createWallet").mockImplementation(async (_address, callbackUrl) => ({ addressIn: "encoded%2Fwallet", polygonAddressIn: deposit, callbackUrl, ipnToken: "token", raw: {} }))
    jest.spyOn(CryptoApi.prototype, "createHostedWallet").mockImplementation(async (_wallets, _amount, _currency, callbackUrl) => ({ paymentToken: "hosted%2Ftoken", callbackUrl, ipnToken: "token", raw: {} }))
    jest.spyOn(CryptoApi.prototype, "info").mockResolvedValue({ coin: "polygon_usdc", minimum: "1", prices: { usd: "1" } })
    const verifier = new CallbackVerifier({ keys: { test: keys.publicKey.export({ type: "spki", format: "pem" }).toString() } })
    jest.spyOn(CallbackVerifier.prototype, "verifyRequest").mockImplementation((url, req) => verifier.verify(url, rawQueryFrom(req), req.headers["x-paygate-signature"] as string, req.headers["x-paygate-key-id"] as string))
  })
  afterEach(() => { process.env = originalEnv; jest.restoreAllMocks(); jest.clearAllMocks() })

  it("stays disabled without wallets and requires a secret/public callback when enabled", () => {
    expect(getPaygateConfig({}).enabled).toBe(false)
    expect(() => getPaygateConfig({ ...env, PAYGATE_CALLBACK_SECRET: "" })).toThrow(/SECRET/)
    expect(() => getPaygateConfig({ ...env, MEDUSA_BACKEND_URL: "http://localhost:9000" })).toThrow(/HTTPS/)
    expect(() => getPaygateConfig({ ...env, PAYGATE_CARD_WALLET: "bad" })).toThrow(/EVM/)
    expect(() => getPaygateConfig({ ...env, PAYGATE_CARD_MIN_NET_RATIO: "0.6" })).toThrow(/between/)
  })

  it("uses the canonical HTTPS provider-list path and never follows a downgrade redirect", async () => {
    jest.mocked(CardApi.prototype.providers).mockRestore()
    const request = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ providers: [] }), { status: 200 }))
    await createPaygateClient(config()).card.providers()
    expect(request).toHaveBeenCalledWith(`https://${env.PAYGATE_API_DOMAIN}/control/provider-status/`, expect.objectContaining({ redirect: "manual" }))
    request.mockClear()
    request.mockResolvedValue(new Response("", { status: 301, headers: { Location: `http://${env.PAYGATE_API_DOMAIN}/control/provider-status/` } }))
    await expect(createPaygateClient(config()).card.providers()).rejects.toThrow(/301/)
    expect(request).toHaveBeenCalledTimes(1)
  })

  it("uses major currency units and creates a unique, server-bound hosted card invoice", async () => {
    const a = await start()
    const b = await start()
    const state = readPaygate(a.data, env.PAYGATE_CALLBACK_SECRET)
    expect(state.amount).toBe("100")
    expect(state.reference).not.toBe(readPaygate(b.data, env.PAYGATE_CALLBACK_SECRET).reference)
    expect(state.deposit_address).toBe(deposit)
    expect(new URL(state.checkout_url).origin).toBe("https://checkout.paygate.to")
    expect(new URL(state.checkout_url).searchParams.get("amount")).toBe("100")
    expect(CardApi.prototype.createWallet).toHaveBeenCalledWith(merchant, expect.stringContaining("reference="))
  })

  it("creates hosted crypto checkout with the configured networks and visible network fees", async () => {
    const result = await provider("crypto").initiatePayment({ amount: 100, currency_code: "usd", context: { idempotency_key: "payses_test" }, data: { cart_id: "cart_test", email: "buyer@example.com" } })
    const state = readPaygate(result.data, env.PAYGATE_CALLBACK_SECRET)
    expect(new URL(state.checkout_url).pathname).toBe("/crypto/hosted.php")
    expect(new URL(state.checkout_url).searchParams.get("add_fees")).toBe("1")
  })

  it("refuses card checkout when the amount is below every active provider minimum", async () => {
    jest.mocked(CardApi.prototype.providers).mockResolvedValue([{ id: "example", name: "Example", active: true, status: "active", minimumAmount: "150", minimumCurrency: "USD" }])
    await expect(start()).rejects.toThrow(/minimum/)
    expect(CardApi.prototype.createWallet).not.toHaveBeenCalled()
  })

  it("defers authorization, rejects forged paid flags and rejects capture before a verified settlement", async () => {
    const result = await start()
    expect((await provider().authorizePayment({ data: result.data })).status).toBe("pending_authorization")
    await expect(provider().capturePayment({ data: result.data })).rejects.toThrow(/verified/)
    const changed = structuredClone(result.data!)
    const changedState = changed.paygate as { settled: boolean }
    changedState.settled = true
    await expect(provider().authorizePayment({ data: changed })).rejects.toThrow(/modified/)
    await expect(provider().refundPayment({ amount: 100, data: result.data })).rejects.toThrow(/no funds were sent/)
  })

  it("rejects a changed invoice instead of reusing an old amount's payment link", async () => {
    const result = await start()
    await expect(provider().updatePayment({ amount: 101, currency_code: "usd", data: result.data })).rejects.toThrow(/total changed/)
  })

  it("uses exact decimals and refuses a callback that paid another wallet", async () => {
    const state = readPaygate((await start()).data, env.PAYGATE_CALLBACK_SECRET)
    const data = new CallbackData({ value_coin: "1.123456789123456789", value_forwarded_coin: "1", address_out: JSON.stringify({ [merchant]: "1" }), address_in: deposit, txid_in: "tx", txid_out: "out", coin: "polygon_usdc" })
    expect(paygateReceipt(state, data, "1").usd).toBe("1.123456789123456789")
    expect(() => paygateReceipt(state, new CallbackData({ ...data.all(), address_out: JSON.stringify({ [other]: "1" }) }), "1")).toThrow(/merchant wallet/)
    expect(() => paygateReceipt(state, new CallbackData({ ...data.all(), address_in: other }), "1")).toThrow(/deposit address/)
  })

  async function setup() {
    const result = await start()
    const state = readPaygate(result.data, env.PAYGATE_CALLBACK_SECRET)
    const session = { id: "payses_test", provider_id: PAYGATE_CARD, amount: 100, currency_code: "usd", status: "pending_authorization", data: result.data }
    let captured = false
    const payments = {
      retrievePaymentSession: jest.fn(async () => structuredClone(session)),
      updatePaymentSession: jest.fn(async (input: typeof session) => { session.data = input.data; session.status = input.status; return session }),
      listPayments: jest.fn(async () => captured ? [{ provider_id: PAYGATE_CARD, amount: 100, currency_code: "usd", captured_at: new Date(), payment_session: { id: session.id }, captures: [{ amount: 100 }], refunds: [] }] : []),
    }
    let tail = Promise.resolve()
    const locking = { execute: (_key: string, job: () => Promise<unknown>) => { const task = tail.then(job); tail = task.then(() => undefined, () => undefined); return task } }
    const query = { graph: jest.fn(async () => ({ data: [{ order: { id: "order_test", status: "pending" } }] })) }
    const container = { resolve: (name: string) => ({ payment: payments, locking, query })[name] } as unknown as MedusaContainer
    const run = jest.fn(async () => { session.status = "authorized"; captured = true })
    jest.mocked(processPaymentWorkflow).mockReturnValue({ run } as never)
    return { state, session, payments, container, run, query }
  }

  it("verifies the raw signed URL, rejects reordered query data and never credits pending notices", async () => {
    const test = await setup()
    const request = callback(test.state)
    await expect(reconcilePaygate({ ...request, originalUrl: request.originalUrl.replace("value_coin=100", "value_coin=1000") }, test.container)).rejects.toThrow(/signature/)
    await expect(reconcilePaygate(callback(test.state, { pending: "1" }), test.container)).resolves.toEqual({ state: "pending" })
    expect(test.payments.updatePaymentSession).not.toHaveBeenCalled()
    expect(test.run).not.toHaveBeenCalled()
  })

  it("accumulates partial payments and captures once after simultaneous duplicate callbacks", async () => {
    const test = await setup()
    await expect(reconcilePaygate(callback(test.state, { value_coin: "40", value_forwarded_coin: "39" }), test.container)).resolves.toEqual({ state: "underpaid" })
    expect(test.run).not.toHaveBeenCalled()
    const rest = callback(test.state, { value_coin: "60", value_forwarded_coin: "59", txid_in: "tx_2" })
    await Promise.all([reconcilePaygate(rest, test.container), reconcilePaygate(rest, test.container)])
    expect(test.run).toHaveBeenCalledTimes(1)
    const saved = readPaygate(test.session.data, env.PAYGATE_CALLBACK_SECRET)
    expect(saved.receipts).toHaveLength(2)
    expect(saved.settled).toBe(true)
    expect(saved.review).toBe("")
  })

  it("does not capture funds for a canceled order or with a forged reference token", async () => {
    const test = await setup()
    await expect(reconcilePaygate(callback(test.state, { token: "bad" }), test.container)).rejects.toThrow(/reference/)
    test.query.graph.mockResolvedValue({ data: [{ order: { id: "order_test", status: "canceled" } }] })
    await expect(reconcilePaygate(callback(test.state), test.container)).rejects.toThrow(/review/)
    expect(test.run).not.toHaveBeenCalled()
  })

  it("does not credit a forged merchant payout or a case-changed duplicate transaction", async () => {
    const test = await setup()
    await expect(reconcilePaygate(callback(test.state, { address_out: JSON.stringify({ [other]: "1" }) }), test.container)).rejects.toThrow(/merchant wallet/)
    expect(test.payments.updatePaymentSession).not.toHaveBeenCalled()
    const transaction = `0x${"AB".repeat(32)}`
    await reconcilePaygate(callback(test.state, { txid_in: transaction, value_coin: "40", value_forwarded_coin: "39" }), test.container)
    await reconcilePaygate(callback(test.state, { txid_in: transaction.toLowerCase(), value_coin: "40", value_forwarded_coin: "39" }), test.container)
    expect(readPaygate(test.session.data, env.PAYGATE_CALLBACK_SECRET).receipts).toHaveLength(1)
    expect(test.run).not.toHaveBeenCalled()
  })

  it("freezes the invoice fee policy rather than silently accepting less after configuration changes", async () => {
    const test = await setup()
    process.env.PAYGATE_CARD_MIN_NET_RATIO = "0.9"
    await expect(reconcilePaygate(callback(test.state, { value_coin: "95", value_forwarded_coin: "94" }), test.container)).resolves.toEqual({ state: "underpaid" })
    expect(test.run).not.toHaveBeenCalled()
  })

  it("holds fulfillment even if an unverified payment row claims to be captured", async () => {
    const test = await setup()
    test.session.status = "captured"
    test.query.graph.mockResolvedValue({ data: [{ payment_collections: [{ payment_sessions: [{ id: test.session.id, provider_id: PAYGATE_CARD }] }] }] } as never)
    await expect(guardPaygateFulfillment({ order_id: "order_test" }, test.container)).rejects.toThrow(/on hold/)
    const state = readPaygate(test.session.data, env.PAYGATE_CALLBACK_SECRET)
    test.session.data = { paygate: sealPaygate({ ...state, settled: true }, env.PAYGATE_CALLBACK_SECRET) }
    await test.run()
    await expect(guardPaygateFulfillment({ order_id: "order_test" }, test.container)).resolves.toEqual({ allowed: true })
  })

  it("blocks injected browser payment state before looking up the cart", async () => {
    await expect(preparePaygate({ payment_collection_id: "paycol", customer_id: "customer", data: { settled: true } }, {} as MedusaContainer)).rejects.toThrow(/server/)
  })

  it("refuses to replace the payment session of an already reserved order", async () => {
    const container = { resolve: () => ({ graph: async () => ({ data: [{ cart: { id: "cart_test", completed_at: new Date(), email: "buyer@example.com", customer_id: "cus" } }] }) }) } as unknown as MedusaContainer
    await expect(preparePaygate({ payment_collection_id: "paycol", customer_id: "cus" }, container)).rejects.toThrow(/no longer available/)
  })

  it("sends pending PayGate orders online-payment guidance instead of bank instructions", () => {
    expect(paymentNotice([{ payment_sessions: [{ provider_id: PAYGATE_CRYPTO }] }]).manual_payment).toBe(false)
  })

  it("keeps sealed session data valid after JSON storage changes property order", async () => {
    const state = readPaygate((await start()).data, env.PAYGATE_CALLBACK_SECRET)
    const reordered = Object.fromEntries(Object.entries(sealPaygate(state, env.PAYGATE_CALLBACK_SECRET)).reverse())
    expect(readPaygate({ paygate: reordered }, env.PAYGATE_CALLBACK_SECRET).session_id).toBe("payses_test")
  })
})
