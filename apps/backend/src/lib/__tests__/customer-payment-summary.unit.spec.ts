import { createHmac } from "node:crypto"
import { customerPaymentSummary } from "../customer-payment-summary"
import { NMI_PROVIDER_ID, type NmiSettlement, type NmiSettlementPayment } from "../nmi-settlement"

const securityKey = "unit-customer-summary-key"
const previousKey = process.env.NMI_SECURITY_KEY
beforeAll(() => { process.env.NMI_SECURITY_KEY = securityKey })
afterAll(() => {
  if (previousKey === undefined) delete process.env.NMI_SECURITY_KEY
  else process.env.NMI_SECURITY_KEY = previousKey
})

function payment(method = "ach", captured = false, canceled = false): NmiSettlementPayment {
  const nmi_state = JSON.stringify({ phase: "payment", session_id: "payses_unit", transactionid: "txn_unit",
    payment_method: method, amount: 25.5, currency_code: "usd", captured, canceled })
  return {
    id: "pay_unit", provider_id: NMI_PROVIDER_ID, payment_session_id: "payses_unit", amount: 25.5, currency_code: "usd",
    data: { nmi_state, nmi_signature: createHmac("sha256", securityKey).update(`vetud-nmi-v1:${nmi_state}`).digest("hex") },
    captured_at: captured ? new Date() : null,
  }
}

function settlement(status: NmiSettlement["status"] = "settled"): NmiSettlement {
  return {
    version: 1, source: "nmi-hmac-v1", payment_id: "pay_unit", provider_id: NMI_PROVIDER_ID,
    session_id: "payses_unit", transaction_id: "txn_unit", amount: "25.50", currency_code: "usd",
    status, hold: status !== "settled", reconciliation_required: status !== "settled", capture_recorded: true,
    event_id: "a".repeat(64), event_type: "transaction.check.status.settle", received_at: new Date().toISOString(),
  }
}

const reference = { id: "pay_unit", provider_id: NMI_PROVIDER_ID }

describe("customer-safe payment summaries", () => {
  it("leaves MakePay and manual methods separate and never infers a method without a payment", () => {
    expect(customerPaymentSummary([], [])).toEqual({ method: "unknown" })
    expect(customerPaymentSummary([{ id: "pay_other", provider_id: "pp_makepay_makepay" }], [])).toEqual({ method: "online" })
    expect(customerPaymentSummary([{ id: "pay_other", provider_id: "pp_system_default" }], [])).toEqual({ method: "manual" })
  })

  it("shows a signed bank debit as processing until actual settlement and capture agree", () => {
    const row = payment()
    expect(customerPaymentSummary([reference], [row])).toEqual({ method: "nmi_ach", review: "pending_settlement" })
    row.metadata = { nmi_settlement: settlement() }
    expect(customerPaymentSummary([reference], [row])).toEqual({ method: "nmi_ach", review: "pending_settlement" })
    const captured = { ...payment("ach", true), metadata: row.metadata }
    expect(customerPaymentSummary([reference], [captured])).toEqual({ method: "nmi_ach" })
  })

  it("does not treat a captured timestamp or browser settlement flags as bank settlement", () => {
    const row = payment("ach", true)
    row.data = { ...row.data, nmi_settlement: settlement(), ach_settled: true }
    expect(customerPaymentSummary([reference], [row])).toEqual({ method: "nmi_ach", review: "requires_review" })
  })

  it.each(["returned", "late_returned"] as const)("shows %s even after capture", (status) => {
    const row = { ...payment("ach", true), metadata: { nmi_settlement: settlement(status) } }
    expect(customerPaymentSummary([reference], [row])).toEqual({ method: "nmi_ach", review: "returned" })
  })

  it("does not hide a returned debit behind another successful payment", () => {
    const card = { ...payment("card", true), id: "pay_card" }
    const returned = { ...payment("ach", true), metadata: { nmi_settlement: settlement("returned") } }
    expect(customerPaymentSummary([{ id: card.id, provider_id: NMI_PROVIDER_ID }, reference], [card, returned]))
      .toEqual({ method: "nmi_ach", review: "returned" })
  })

  it("fails closed for missing, invalid or mismatched payment evidence without exposing it", () => {
    const invalid = payment()
    invalid.data = { ...invalid.data, nmi_signature: "0".repeat(64), payment_method: "card" }
    const wrongCurrency = { ...payment(), currency_code: "eur" }
    const badSettlement = { ...payment("ach", true), metadata: { nmi_settlement: { ...settlement(), transaction_id: "txn_someone_else" } } }
    for (const rows of [[], [invalid], [wrongCurrency], [badSettlement]]) {
      expect(customerPaymentSummary([reference], rows)).toEqual({ method: "unknown", review: "requires_review" })
    }
  })

  it("handles card authorization, confirmed capture, inconsistent capture and cancellation", () => {
    expect(customerPaymentSummary([reference], [payment("card")])).toEqual({ method: "nmi_card" })
    expect(customerPaymentSummary([reference], [payment("card", true)])).toEqual({ method: "nmi_card" })
    expect(customerPaymentSummary([reference], [{ ...payment("card"), captured_at: new Date() }])).toEqual({ method: "nmi_card", review: "requires_review" })
    expect(customerPaymentSummary([reference], [payment("card", false, true)])).toEqual({ method: "nmi_card", review: "canceled" })
  })
})
