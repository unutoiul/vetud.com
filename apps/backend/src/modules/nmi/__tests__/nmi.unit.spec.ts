import { NmiProviderService } from "medusa-payment-nmi"
import NmiProvider from "../service"
import { getNmiConfig } from "../../../lib/nmi-config"
import { nmiCheckoutData } from "../../../workflows/prepare-nmi-session"
import { paymentNotice } from "../../../lib/payment-notice"
import { validateNmiCart } from "../../../lib/nmi-cart"
import { SingleAttemptNmiClient } from "../client"

const options = {
  securityKey: "unit-test-private-key", tokenizationKey: "public-token-key", webhookSecret: "test-hook",
  captureMethod: "auth" as const, sandbox: true, accountCurrency: "usd", merchantCountry: "US",
  achEnabled: true, walletsEnabled: false,
}
const context = { idempotency_key: "payses_test" }
const token = { payment_token: "single-use-token", payment_method: "card" }
const initiate = (provider: NmiProvider, data: Record<string, unknown> = token) => provider.initiatePayment({ amount: 125.5, currency_code: "usd", context, data })

describe("guarded NMI provider", () => {
  afterEach(() => jest.restoreAllMocks())

  it("is disabled by default and never infers live mode from NODE_ENV", () => {
    expect(getNmiConfig({ NODE_ENV: "production" })).toMatchObject({ enabled: false, sandbox: true, ach_enabled: false, wallets_enabled: false })
    expect(() => getNmiConfig({ NMI_ENABLED: "true" })).toThrow("NMI_SECURITY_KEY")
  })

  it("fails closed on incomplete currency/country config and non-USD ACH", () => {
    const env = { NMI_ENABLED: "true", NMI_SECURITY_KEY: "private", NMI_TOKENIZATION_KEY: "public", NMI_WEBHOOK_SECRET: "secret" }
    expect(() => getNmiConfig(env)).toThrow("NMI_ACCOUNT_CURRENCY")
    expect(() => getNmiConfig({ ...env, NMI_ACCOUNT_CURRENCY: "usd" })).toThrow("NMI_MERCHANT_COUNTRY")
    expect(() => getNmiConfig({ ...env, NMI_ACCOUNT_CURRENCY: "eur", NMI_MERCHANT_COUNTRY: "DE", NMI_ACH_ENABLED: "true" })).toThrow("USD")
    expect(getNmiConfig({ ...env, NMI_ACCOUNT_CURRENCY: "usd", NMI_MERCHANT_COUNTRY: "US" }).sandbox).toBe(true)
  })

  it("rejects currency mismatches and invalid amounts before any gateway call", async () => {
    const provider = new NmiProvider({}, options)
    await expect(provider.initiatePayment({ amount: 10, currency_code: "eur", context })).rejects.toThrow("only available in USD")
    for (const amount of [0, -1, 1.001, NaN, Infinity]) {
      await expect(provider.initiatePayment({ amount, currency_code: "usd", context })).rejects.toThrow()
    }
  })

  it("rejects raw account numbers and browser-controlled transaction fields", () => {
    for (const data of [{ amount: 1 }, { ccnumber: "not-a-card" }, { checkaccount: "bank" }, { billing: {} }, { transactionid: "fake" }, { nmi_state: "forged" }]) {
      expect(() => nmiCheckoutData(data)).toThrow("Only a secure payment token")
    }
    expect(nmiCheckoutData(token)).toEqual(token)
    expect(nmiCheckoutData()).toEqual({})
  })

  it("uses signed server amounts instead of injected outer fields", async () => {
    const spy = jest.spyOn(NmiProviderService.prototype, "authorizePayment").mockResolvedValue({ status: "authorized", data: { transactionid: "txn_1" } })
    const provider = new NmiProvider({}, options)
    const session = await initiate(provider)
    const authorized = await provider.authorizePayment({ context, data: { ...session.data, amount: 1, currency_code: "eur", transactionid: "fake", captured: true } })
    expect(spy.mock.calls[0][0].data).toMatchObject({ amount: 125.5, currency_code: "usd", session_id: "payses_test" })
    expect(authorized).toMatchObject({ status: "authorized", data: { amount: 125.5, transactionid: "txn_1" } })
    expect(authorized.data).not.toHaveProperty("payment_token")
    expect(JSON.stringify(session.data)).not.toContain(options.securityKey)
    expect(JSON.stringify(session.data)).not.toContain(options.webhookSecret)
  })

  it("rejects tampered proofs and cross-session replay", async () => {
    const provider = new NmiProvider({}, options)
    const session = await initiate(provider)
    await expect(provider.authorizePayment({ context, data: { ...session.data, nmi_state: String(session.data.nmi_state).replace("125.5", "1") } })).rejects.toThrow("Payment details changed")
    await expect(provider.authorizePayment({ context: { idempotency_key: "payses_other" }, data: session.data })).rejects.toThrow("does not match")
  })

  it("invalidates tokens after cart edits", async () => {
    const provider = new NmiProvider({}, options)
    const session = await initiate(provider)
    const updated = await provider.updatePayment({ amount: 150, currency_code: "usd", data: session.data })
    expect(updated.data.payment_token).toBeUndefined()
    await expect(provider.authorizePayment({ context, data: updated.data })).rejects.toThrow("secure payment form")
  })

  it("compares the signed checkout intent with the locked cart before completion", async () => {
    const provider = new NmiProvider({}, options)
    const billing = { email: "research@example.test", first_name: "Test", address_1: "Test street" }
    const session = await initiate(provider, { ...token, billing })
    const cart = { total: 125.5, currency_code: "usd", email: billing.email, billing_address: billing,
      payment_collection: { payment_sessions: [{ id: context.idempotency_key, provider_id: "pp_nmi_primary", amount: 125.5, currency_code: "usd", data: session.data }] } }
    expect(() => validateNmiCart(cart)).not.toThrow()
    expect(() => validateNmiCart({ ...cart, total: 150 })).toThrow("details changed")
    expect(() => validateNmiCart({ ...cart, billing_address: { ...billing, address_1: "Different street" } })).toThrow("details changed")
    expect(() => validateNmiCart({ ...cart, currency_code: "eur" })).toThrow("details changed")
  })

  it("requires ACH provisioning, account types and explicit debit consent", async () => {
    const provider = new NmiProvider({}, options)
    const session = await initiate(provider, { ...token, payment_method: "ach" })
    await expect(provider.authorizePayment({ context, data: session.data })).rejects.toThrow("authorize this single debit")
    const disabled = new NmiProvider({}, { ...options, achEnabled: false })
    await expect(disabled.authorizePayment({ context, data: session.data })).rejects.toThrow("not enabled")
  })

  it("does not authorize an already authorized signed receipt twice", async () => {
    const spy = jest.spyOn(NmiProviderService.prototype, "authorizePayment").mockResolvedValue({ status: "authorized", data: { transactionid: "txn_1" } })
    const provider = new NmiProvider({}, options)
    const session = await initiate(provider)
    const first = await provider.authorizePayment({ context, data: session.data })
    await provider.authorizePayment({ context, data: first.data })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it("rejects partial capture before a gateway request", async () => {
    jest.spyOn(NmiProviderService.prototype, "authorizePayment").mockResolvedValue({ status: "authorized", data: { transactionid: "txn_1" } })
    const capture = jest.spyOn(NmiProviderService.prototype, "capturePayment")
    const provider = new NmiProvider({ captureService: { retrieve: async () => ({ amount: 1 }) } }, options)
    const session = await initiate(provider)
    const payment = await provider.authorizePayment({ context, data: session.data })
    await expect(provider.capturePayment({ data: payment.data, context: { idempotency_key: "capt_test" } })).rejects.toThrow("Partial NMI capture")
    expect(capture).not.toHaveBeenCalled()
  })

  it("checks fresh settlement metadata even when capture is called outside Admin", async () => {
    jest.spyOn(NmiProviderService.prototype, "authorizePayment").mockResolvedValue({ status: "authorized", data: { transactionid: "txn_1" } })
    const capture = jest.spyOn(NmiProviderService.prototype, "capturePayment")
    const provider = new NmiProvider({ paymentService: { list: async () => [{
      id: "pay_test", provider_id: "pp_nmi_primary", payment_session_id: context.idempotency_key,
      amount: 125.5, currency_code: "usd", captured_at: new Date(), metadata: {},
    }] } }, options)
    const session = await initiate(provider, { ...token, payment_method: "ach", ach_authorized: true, account_type: "checking", account_holder_type: "personal" })
    const payment = await provider.authorizePayment({ context, data: session.data })
    await expect(provider.capturePayment({ data: payment.data, context: { idempotency_key: "capt_test" } })).rejects.toThrow("verified NMI settlement")
    expect(capture).not.toHaveBeenCalled()
  })

  it("leaves webhook capture to the correlated reconciliation workflow", async () => {
    const provider = new NmiProvider({}, options)
    expect(await provider.getWebhookActionAndData()).toEqual({ action: "not_supported" })
  })

  it("never retries an ambiguous money-moving POST or reveals raw gateway output", async () => {
    const request = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("private transport details"))
    const client = new SingleAttemptNmiClient(options.securityKey, true)
    await expect(client.transact({ type: "auth", paymentToken: "token", amount: 125.5 })).rejects.toThrow("Do not submit another payment")
    expect(request).toHaveBeenCalledTimes(1)
    request.mockReset().mockResolvedValue(new Response("private gateway output", { status: 502 }))
    await expect(client.transact({ type: "capture", transactionId: "txn_1" })).rejects.toThrow("could not be confirmed")
    expect(request).toHaveBeenCalledTimes(1)
    request.mockReset().mockResolvedValue(new Response("response=2&responsetext=private+details"))
    await expect(client.transact({ type: "auth", paymentToken: "token", amount: 125.5 })).rejects.toThrow("payment was declined")
    expect(request).toHaveBeenCalledTimes(1)
  })

  it("uses only the matching sandbox endpoint and requires positive confirmation", async () => {
    const request = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response("response=1&transactionid=txn_1"))
    const client = new SingleAttemptNmiClient(options.securityKey, true)
    expect(await client.transact({ type: "auth", paymentToken: "token", amount: 125.5 })).toMatchObject({ transactionid: "txn_1" })
    expect(request.mock.calls[0][0]).toBe("https://sandbox.nmi.com/api/transact.php")
    expect(String(request.mock.calls[0][1]?.body)).toContain("type=auth")
    request.mockResolvedValue(new Response("response=1"))
    await expect(client.transact({ type: "capture", transactionId: "txn_1" })).rejects.toThrow("could not be confirmed")
  })

  it("does not void after an uncertain refund or swallow a failed ACH cancellation", async () => {
    jest.spyOn(NmiProviderService.prototype, "authorizePayment").mockResolvedValue({ status: "authorized", data: { transactionid: "txn_1" } })
    const request = jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timeout"))
    const provider = new NmiProvider({}, options)
    const session = await initiate(provider, { ...token, payment_method: "ach", ach_authorized: true, account_type: "checking", account_holder_type: "personal" })
    const payment = await provider.authorizePayment({ context, data: session.data })
    await expect(provider.refundPayment({ data: payment.data, amount: 125.5 })).rejects.toThrow("could not be confirmed")
    expect(request).toHaveBeenCalledTimes(1)
    expect(String(request.mock.calls[0][1]?.body)).toContain("type=refund")
    request.mockClear()
    await expect(provider.cancelPayment({ data: payment.data })).rejects.toThrow("could not be confirmed")
    expect(request).toHaveBeenCalledTimes(1)
    expect(String(request.mock.calls[0][1]?.body)).toContain("type=void")
  })

  it("classifies personal WEB and business CCD debits and retains a consent receipt", async () => {
    const request = jest.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("response=1&transactionid=txn_1"))
    const client = new SingleAttemptNmiClient(options.securityKey, true)
    for (const [holder, sec] of [["personal", "WEB"], ["business", "CCD"]] as const) {
      await client.transact({ type: "sale", paymentToken: "token", amount: 125.5, ach: { accountType: "checking", accountHolderType: holder } })
      expect(String(request.mock.lastCall?.[1]?.body)).toContain(`sec_code=${sec}`)
    }
    const provider = new NmiProvider({}, options)
    const session = await initiate(provider, { ...token, payment_method: "ach", ach_authorized: true, account_type: "checking", account_holder_type: "business" })
    const payment = await provider.authorizePayment({ context, data: session.data })
    expect(payment.data?.ach_consent).toMatchObject({ version: "vetud-single-debit-2026-10", account_holder_type: "business", sec_code: "CCD" })
    expect(payment.data).not.toHaveProperty("payment_token")
  })

  it("never asks NMI customers to pay again by bank transfer", () => {
    expect(paymentNotice().manual_payment).toBe(true)
    expect(paymentNotice([{ payments: [{ provider_id: "pp_nmi_primary", data: { payment_method: "ach" } }] }])).toMatchObject({ manual_payment: false, payment_summary: expect.stringContaining("awaiting settlement") })
    expect(paymentNotice([{ payments: [{ provider_id: "pp_nmi_primary", data: { payment_method: "card" } }] }])).toMatchObject({ manual_payment: false, payment_summary: expect.stringContaining("authorized") })
  })
})
