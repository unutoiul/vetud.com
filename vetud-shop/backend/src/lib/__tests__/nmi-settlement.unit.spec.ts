import { createHmac } from "node:crypto"
import {
  assertNmiAchCaptureAllowed, assertNmiManualCaptureAllowed, assertNmiPaymentCanFulfill,
  nmiAmount, NMI_PROVIDER_ID, readNmiPaymentIdentity,
} from "../nmi-settlement"
import type { NmiPaymentIdentity, NmiSettlement, NmiSettlementPayment } from "../nmi-settlement"
import { verifyNmiWebhook } from "../nmi-settlement-webhook"

const securityKey = "unit-security-key"
const secret = "unit-webhook-secret"
const previousKey = process.env.NMI_SECURITY_KEY
beforeAll(() => { process.env.NMI_SECURITY_KEY = securityKey })
afterAll(() => {
  if (previousKey === undefined) delete process.env.NMI_SECURITY_KEY
  else process.env.NMI_SECURITY_KEY = previousKey
})

function identity(method: "card" | "ach" = "ach", captured = false): NmiPaymentIdentity {
  return { session_id: "payses_unit", transactionid: "txn_unit", payment_method: method, amount: 25.5, currency_code: "usd", captured }
}

function payment(method: "card" | "ach" = "ach", captured = false): NmiSettlementPayment {
  const state = identity(method, captured)
  const nmi_state = JSON.stringify({ ...state, phase: "payment" })
  return {
    id: "pay_unit", provider_id: NMI_PROVIDER_ID, payment_session_id: state.session_id,
    amount: 25.5, currency_code: "usd",
    data: { ...state, nmi_state, nmi_signature: createHmac("sha256", securityKey).update(`vetud-nmi-v1:${nmi_state}`).digest("hex") },
    captured_at: captured ? new Date() : null,
  }
}

function settled(): NmiSettlement {
  return {
    version: 1, source: "nmi-hmac-v1", payment_id: "pay_unit", provider_id: NMI_PROVIDER_ID,
    session_id: "payses_unit", transaction_id: "txn_unit", amount: "25.50", currency_code: "usd",
    status: "settled", hold: false, reconciliation_required: false, event_id: "a".repeat(64),
    event_type: "transaction.check.status.settle", received_at: new Date().toISOString(), capture_recorded: true,
  }
}

function signedWebhook(body = {}, type = "transaction.check.status.settle") {
  const raw = JSON.stringify({ event_type: type, event_body: {
    order_id: "payses_unit", merchant_defined_fields: { "1": "payses_unit" },
    transaction_id: "txn_unit", action: { amount: "25.50" }, ...body,
  } })
  const sig = createHmac("sha256", secret).update(`unit-nonce.${raw}`).digest("hex")
  return { provider: "nmi_primary", payload: { rawData: Buffer.from(raw), headers: { "webhook-signature": `t=unit-nonce,s=${sig}` }, data: {} } }
}

describe("NMI webhook authentication and normalization", () => {
  it("rejects bad, missing, and malformed signatures and missing raw bytes", () => {
    const event = signedWebhook()
    event.payload.headers["webhook-signature"] = `t=unit-nonce,s=${"0".repeat(64)}`
    expect(() => verifyNmiWebhook(event, secret, "usd")).toThrow("signature")
    expect(() => verifyNmiWebhook({ ...event, payload: { ...event.payload, headers: {} } }, secret, "usd")).toThrow("signature")
    event.payload.headers["webhook-signature"] = `t=unit-nonce,s=${"é".repeat(64)}`
    expect(() => verifyNmiWebhook(event, secret, "usd")).toThrow("signature")
    expect(() => verifyNmiWebhook({ ...event, payload: { ...event.payload, rawData: undefined } }, secret, "usd")).toThrow("raw request body")
  })

  it("verifies serialized event-bus buffers and parses signed bytes instead of payload.data", () => {
    const input = signedWebhook()
    input.payload.data = { event_type: "transaction.check.status.return", event_body: { order_id: "payses_attacker" } }
    const parsed = verifyNmiWebhook(input, secret, "usd")
    expect(parsed).toMatchObject({ status: "settled", session_id: "payses_unit", transaction_id: "txn_unit", amount: "25.50" })
    expect(verifyNmiWebhook({ ...input, payload: { ...input.payload, rawData: input.payload.rawData.toJSON() } }, secret, "usd")).toEqual(parsed)
    input.payload.rawData = Buffer.from(`${input.payload.rawData.toString()} `)
    expect(() => verifyNmiWebhook(input, secret, "usd")).toThrow("signature")
  })

  it("rejects ambiguous session references, wrong currency, missing transaction and conflicting amounts", () => {
    expect(() => verifyNmiWebhook(signedWebhook({ merchant_defined_fields: { "1": "payses_other" } }), secret, "usd")).toThrow("session references")
    expect(() => verifyNmiWebhook(signedWebhook({ currency: "EUR" }), secret, "usd")).toThrow("currency")
    expect(() => verifyNmiWebhook(signedWebhook({ transaction_id: "" }), secret, "usd")).toThrow("transaction")
    expect(() => verifyNmiWebhook(signedWebhook({ requested_amount: "25.51" }), secret, "usd")).toThrow("amounts")
    expect(() => verifyNmiWebhook(signedWebhook({ action: { amount: "25.501" } }), secret, "usd")).toThrow("amount")
  })

  it("does not reconcile other providers or treat generic capture/sale/batch events as ACH settlement", () => {
    expect(verifyNmiWebhook({ ...signedWebhook(), provider: "makepay" }, undefined, undefined)).toBeNull()
    for (const type of ["transaction.sale.success", "transaction.capture.success", "settlement.batch.complete"]) {
      expect(verifyNmiWebhook(signedWebhook({}, type), secret, "usd")).toBeNull()
    }
  })

  it("compares exact major amounts without silent rounding", () => {
    expect(nmiAmount({ value: "25.500", precision: 20 })).toBe("25.50")
    for (const invalid of [undefined, null, "", 0, -1, "NaN", "Infinity", "25.501"]) {
      expect(() => nmiAmount(invalid)).toThrow("amount")
    }
  })
})

describe("NMI authoritative payment guards", () => {
  it("blocks pending ACH despite captured_at and forged browser settlement flags", () => {
    const row = payment("ach", true)
    row.data = { ...row.data, settled: true, nmi_settlement: settled(), payment_method: "card" }
    for (const action of ["fulfillment", "shipment"] as const) {
      expect(() => assertNmiPaymentCanFulfill(row, action)).toThrow("hold")
    }
    expect(() => assertNmiAchCaptureAllowed(row, identity())).toThrow("verified NMI settlement")
  })

  it("requires completed reconciliation and sticky holds even on captured ACH", () => {
    const row = payment("ach", true)
    row.metadata = { nmi_settlement: settled() }
    expect(() => assertNmiPaymentCanFulfill(row, "fulfillment")).not.toThrow()
    expect(() => assertNmiPaymentCanFulfill(row, "shipment")).not.toThrow()
    row.metadata.nmi_settlement = { ...settled(), capture_recorded: false }
    expect(() => assertNmiPaymentCanFulfill(row, "fulfillment")).toThrow("hold")
    for (const status of ["returned", "late_returned"] as const) {
      row.metadata.nmi_settlement = { ...settled(), status, hold: true, reconciliation_required: true }
      expect(() => assertNmiPaymentCanFulfill(row, "shipment")).toThrow("hold")
      expect(() => assertNmiAchCaptureAllowed(row, identity())).toThrow("verified NMI settlement")
    }
  })

  it("binds trusted metadata to the payment, session, transaction, provider, amount and currency", () => {
    for (const change of [
      { payment_id: "pay_other" }, { provider_id: "pp_other" }, { session_id: "payses_other" },
      { transaction_id: "txn_other" }, { amount: "0.01" }, { currency_code: "eur" },
    ]) {
      const row = payment("ach", true)
      row.metadata = { nmi_settlement: { ...settled(), ...change } }
      expect(() => assertNmiAchCaptureAllowed(row, identity())).toThrow("inconsistent")
    }
  })

  it("allows authorized card packing, requires full capture before shipment and blocks partial manual capture", () => {
    const row = payment("card")
    expect(() => assertNmiPaymentCanFulfill(row, "fulfillment")).not.toThrow()
    expect(() => assertNmiPaymentCanFulfill(row, "shipment")).toThrow("Capture the NMI card")
    expect(() => assertNmiManualCaptureAllowed(row)).not.toThrow()
    expect(() => assertNmiManualCaptureAllowed(row, "25.50")).not.toThrow()
    expect(() => assertNmiManualCaptureAllowed(row, 12)).toThrow("full capture only")
    expect(() => assertNmiPaymentCanFulfill(payment("card", true), "shipment")).not.toThrow()
    row.captured_at = new Date()
    expect(() => assertNmiPaymentCanFulfill(row, "shipment")).toThrow("Capture the NMI card")
  })

  it("blocks manual ACH capture even when settled, and leaves other providers alone", () => {
    const row = payment("ach", true)
    row.metadata = { nmi_settlement: settled() }
    expect(() => assertNmiManualCaptureAllowed(row)).toThrow("Do not manually capture ACH")
    for (const provider_id of ["pp_system_default", "pp_makepay_makepay"]) {
      const other = { ...row, provider_id, data: {} }
      expect(() => assertNmiManualCaptureAllowed(other, 1)).not.toThrow()
      expect(() => assertNmiPaymentCanFulfill(other, "shipment")).not.toThrow()
    }
  })

  it("does not trust tampered or unsigned method/transaction state", () => {
    const row = payment()
    expect(() => readNmiPaymentIdentity({ ...row.data, nmi_state: `${row.data?.nmi_state} ` })).toThrow("unverified")
    expect(() => readNmiPaymentIdentity({ payment_method: "card", captured: true })).toThrow("unverified")
  })
})
