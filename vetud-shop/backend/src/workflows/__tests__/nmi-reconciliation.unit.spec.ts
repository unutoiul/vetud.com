import { createHmac } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { capturePaymentWorkflow } from "@medusajs/medusa/core-flows"
import { assertNmiAchCaptureAllowed, assertNmiPaymentCanFulfill, NMI_PROVIDER_ID, readNmiPaymentIdentity } from "../../lib/nmi-settlement"
import type { NmiSettlement, NmiSettlementPayment } from "../../lib/nmi-settlement"
import { executeNmiReconciliation, validateNmiWebhook } from "../nmi-reconcile-payment"
import { executeNmiPaymentGuard } from "../nmi-payment-guards"

jest.mock("@medusajs/medusa/core-flows", () => ({ capturePaymentWorkflow: jest.fn() }))

const secret = "unit-webhook-secret"
const securityKey = "unit-security-key"
const saved = [process.env.NMI_SECURITY_KEY, process.env.NMI_WEBHOOK_SECRET, process.env.NMI_ACCOUNT_CURRENCY]
beforeAll(() => {
  process.env.NMI_SECURITY_KEY = securityKey
  process.env.NMI_WEBHOOK_SECRET = secret
  process.env.NMI_ACCOUNT_CURRENCY = "usd"
})
afterAll(() => {
  for (const [index, key] of ["NMI_SECURITY_KEY", "NMI_WEBHOOK_SECRET", "NMI_ACCOUNT_CURRENCY"].entries()) {
    if (saved[index] === undefined) delete process.env[key]
    else process.env[key] = saved[index]
  }
})

function signedData(method = "ach", captured = false, transactionid = "txn_unit") {
  const state = { phase: "payment", session_id: "payses_unit", transactionid, payment_method: method, amount: 25.5, currency_code: "usd", captured }
  const nmi_state = JSON.stringify(state)
  return { ...state, nmi_state, nmi_signature: createHmac("sha256", securityKey).update(`vetud-nmi-v1:${nmi_state}`).digest("hex") }
}

function webhook(status = "settle", overrides = {}) {
  const rawData = JSON.stringify({ event_id: `event_${status}`, event_type: `transaction.check.status.${status}`, event_body: {
    order_id: "payses_unit", merchant_defined_fields: { "1": "payses_unit" },
    transaction_id: "txn_unit", action: { amount: "25.50" }, ...overrides,
  } })
  const signature = createHmac("sha256", secret).update(`nonce.${rawData}`).digest("hex")
  return { provider: "nmi_primary", payload: { rawData, headers: { "webhook-signature": `t=nonce,s=${signature}` } } }
}

function harness(method = "ach") {
  const payment: NmiSettlementPayment = {
    id: "pay_unit", provider_id: NMI_PROVIDER_ID, payment_session_id: "payses_unit",
    payment_session: { id: "payses_unit" }, payment_collection_id: "paycol_unit",
    amount: 25.5, currency_code: "usd", data: signedData(method), metadata: { existing: "preserved" },
  }
  const session = {
    id: "payses_unit", provider_id: NMI_PROVIDER_ID, amount: 25.5, currency_code: "usd",
    payment: { id: payment.id }, payment_collection_id: "paycol_unit",
  }
  let lockActive = false
  let tail: Promise<unknown> = Promise.resolve()
  const locking = { execute: jest.fn((_key: string, callback: () => Promise<unknown>) => {
    const next = tail.then(async () => {
      lockActive = true
      try { return await callback() } finally { lockActive = false }
    })
    tail = next.catch(() => undefined)
    return next
  }) }
  const paymentService = {
    retrievePaymentSession: jest.fn(async () => structuredClone(session)),
    retrievePayment: jest.fn(async () => structuredClone(payment)),
    updatePayment: jest.fn(async (update: { id: string; metadata: Record<string, unknown> }) => {
      expect(lockActive).toBe(true)
      expect(Object.keys(update).sort()).toEqual(["id", "metadata"])
      payment.metadata = structuredClone(update.metadata)
      return structuredClone(payment)
    }),
  }
  const logger = { warn: jest.fn(), error: jest.fn() }
  const order = { id: "order_unit", payment_collections: [{ payments: [{ id: payment.id, provider_id: NMI_PROVIDER_ID }] }] }
  const query = { graph: jest.fn(async () => ({ data: [order] })) }
  const container = { resolve: (key: string) => ({
    [Modules.PAYMENT]: paymentService,
    [Modules.LOCKING]: locking,
    [ContainerRegistrationKeys.LOGGER]: logger,
    [ContainerRegistrationKeys.QUERY]: query,
  })[key] } as unknown as MedusaContainer
  const run = jest.fn(async () => {
    expect(lockActive).toBe(true)
    assertNmiAchCaptureAllowed(payment, readNmiPaymentIdentity(payment.data))
    expect((payment.metadata?.nmi_settlement as NmiSettlement).capture_recorded).toBe(false)
    payment.captured_at = new Date().toISOString()
    payment.data = signedData(method, true)
    return { result: payment }
  })
  ;(capturePaymentWorkflow as unknown as jest.Mock).mockReturnValue({ run })
  return { payment, session, paymentService, logger, locking, container, run, query, order }
}

describe("NMI reconciliation workflow", () => {
  it("rejects a bad signature before lookup, persistence, or capture", async () => {
    const h = harness()
    const input = webhook()
    input.payload.headers["webhook-signature"] = `t=nonce,s=${"0".repeat(64)}`
    await expect(executeNmiReconciliation(input, h.container)).rejects.toThrow("signature")
    expect(h.paymentService.retrievePaymentSession).not.toHaveBeenCalled()
    expect(h.paymentService.updatePayment).not.toHaveBeenCalled()
    expect(h.run).not.toHaveBeenCalled()
  })

  it.each(["transaction", "payment provider", "session provider", "amount", "currency", "collection", "method"])("rejects a mismatched %s without modifying payment", async (mismatch) => {
    const h = harness()
    const input = mismatch === "transaction" ? webhook("settle", { transaction_id: "txn_other" }) : webhook()
    if (mismatch === "payment provider") h.payment.provider_id = "pp_other"
    if (mismatch === "session provider") h.session.provider_id = "pp_other"
    if (mismatch === "amount") h.payment.amount = 99
    if (mismatch === "currency") h.payment.currency_code = "eur"
    if (mismatch === "collection") h.payment.payment_collection_id = "paycol_other"
    if (mismatch === "method") h.payment.data = signedData("card")
    await expect(executeNmiReconciliation(input, h.container)).rejects.toThrow("reconciliation failed")
    expect(h.paymentService.updatePayment).not.toHaveBeenCalled()
    expect(h.run).not.toHaveBeenCalled()
  })

  it("persists settlement metadata before core capture and processes duplicates only once", async () => {
    const h = harness()
    const original = structuredClone(h.payment.data)
    await executeNmiReconciliation(webhook(), h.container)
    expect(h.run).toHaveBeenCalledTimes(1)
    expect(h.run).toHaveBeenCalledWith({ input: { payment_id: "pay_unit" }, context: { transactionId: "nmi-settlement-pay_unit" } })
    expect(h.payment.metadata).toMatchObject({ existing: "preserved", nmi_settlement: { status: "settled", hold: false, capture_recorded: true } })
    expect(h.paymentService.updatePayment.mock.calls.every(([input]) => !("data" in input))).toBe(true)
    expect(h.payment.data).not.toEqual(original) // Only the core capture/provider refreshed the signature.
    const result = await executeNmiReconciliation(webhook(), h.container)
    expect(result).toMatchObject({ duplicate: true, status: "settled" })
    expect(h.run).toHaveBeenCalledTimes(1)
    expect(h.paymentService.updatePayment).toHaveBeenCalledTimes(2)
    await expect(executeNmiPaymentGuard({ action: "shipment", order_id: "order_unit" }, h.container)).resolves.toEqual({ allowed: true })
  })

  it("holds returns without capture, refund or cancellation, and ignores a stale settlement", async () => {
    const h = harness()
    const data = structuredClone(h.payment.data)
    await executeNmiReconciliation(webhook("return"), h.container)
    await executeNmiReconciliation(webhook(), h.container)
    await executeNmiReconciliation(webhook("return"), h.container)
    expect(h.payment.metadata?.nmi_settlement).toMatchObject({ status: "returned", hold: true, reconciliation_required: true })
    expect(h.payment.data).toEqual(data)
    expect(h.payment.canceled_at).toBeUndefined()
    expect(h.paymentService.updatePayment).toHaveBeenCalledTimes(1)
    expect(h.run).not.toHaveBeenCalled()
    expect(h.logger.warn).toHaveBeenCalledTimes(1)
    await expect(executeNmiPaymentGuard({ action: "fulfillment", order_id: "order_unit" }, h.container)).rejects.toThrow("hold")
  })

  it("holds a late return after capture and never downgrades it on earlier return/settle replays", async () => {
    const h = harness()
    await executeNmiReconciliation(webhook(), h.container)
    await executeNmiReconciliation(webhook("latereturn"), h.container)
    await executeNmiReconciliation(webhook("return"), h.container)
    await executeNmiReconciliation(webhook(), h.container)
    expect(h.payment.metadata?.nmi_settlement).toMatchObject({ status: "late_returned", hold: true, capture_recorded: true })
    expect(h.run).toHaveBeenCalledTimes(1)
    expect(() => assertNmiPaymentCanFulfill(h.payment, "shipment")).toThrow("hold")
  })

  it("serializes concurrent return and settle delivery before reading trusted state", async () => {
    const h = harness()
    await Promise.all([
      executeNmiReconciliation(webhook("return"), h.container),
      executeNmiReconciliation(webhook(), h.container),
      executeNmiReconciliation(webhook("latereturn"), h.container),
    ])
    expect(h.payment.metadata?.nmi_settlement).toMatchObject({ status: "late_returned", hold: true })
    expect(h.run).not.toHaveBeenCalled()
    expect(h.locking.execute.mock.calls.map(([key]) => key)).toEqual(Array(3).fill("nmi-settlement:payses_unit"))
  })

  it("retains verified metadata and a fulfillment hold after capture failure, then retries safely", async () => {
    const h = harness()
    h.run.mockRejectedValueOnce(new Error("private gateway payload must not appear"))
    await expect(executeNmiReconciliation(webhook(), h.container)).rejects.toThrow("reconciliation failed")
    expect(h.payment.metadata?.nmi_settlement).toMatchObject({ status: "settled", capture_recorded: false })
    expect(() => assertNmiPaymentCanFulfill(h.payment, "fulfillment")).toThrow("hold")
    expect(JSON.stringify(h.logger.error.mock.calls)).not.toContain("private gateway payload")
    await executeNmiReconciliation(webhook(), h.container)
    expect(h.run).toHaveBeenCalledTimes(2)
    expect(h.payment.metadata?.nmi_settlement).toMatchObject({ capture_recorded: true })
  })

  it("surfaces HTTP preflight mismatch and refuses to resurrect a canceled payment", async () => {
    const h = harness()
    await expect(validateNmiWebhook(webhook("settle", { transaction_id: "txn_other" }), h.container)).rejects.toThrow("does not match")
    expect(h.paymentService.updatePayment).not.toHaveBeenCalled()
    h.payment.canceled_at = new Date()
    await expect(executeNmiReconciliation(webhook(), h.container)).rejects.toThrow("reconciliation failed")
    expect(h.run).not.toHaveBeenCalled()
    expect(() => assertNmiPaymentCanFulfill(h.payment, "fulfillment")).toThrow("canceled")
  })

  it("blocks manual ACH and false-captured fulfillment, allows auth card packing, blocks card shipment and partial capture", async () => {
    const h = harness()
    h.payment.captured_at = new Date()
    await expect(executeNmiPaymentGuard({ action: "capture", payment_id: h.payment.id }, h.container)).rejects.toThrow("Do not manually capture ACH")
    await expect(executeNmiPaymentGuard({ action: "fulfillment", order_id: "order_unit" }, h.container)).rejects.toThrow("hold")
    await expect(executeNmiPaymentGuard({ action: "shipment", order_id: "order_unit" }, h.container)).rejects.toThrow("hold")
    const card = harness("card")
    await expect(executeNmiPaymentGuard({ action: "fulfillment", order_id: "order_unit" }, card.container)).resolves.toEqual({ allowed: true })
    await expect(executeNmiPaymentGuard({ action: "shipment", order_id: "order_unit" }, card.container)).rejects.toThrow("Capture the NMI card")
    await expect(executeNmiPaymentGuard({ action: "capture", payment_id: card.payment.id, amount: 1 }, card.container)).rejects.toThrow("full capture only")
    await expect(executeNmiPaymentGuard({ action: "capture", payment_id: card.payment.id, amount: 25.5 }, card.container)).resolves.toEqual({ allowed: true })
  })
})
