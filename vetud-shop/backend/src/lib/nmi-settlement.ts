import { createHmac, timingSafeEqual } from "node:crypto"
import type { BigNumberInput } from "@medusajs/framework/types"
import { BigNumber, MedusaError } from "@medusajs/framework/utils"

export const NMI_PROVIDER_ID = "pp_nmi_primary"
export const NMI_WEBHOOK_PROVIDER = "nmi_primary"
export const NMI_SETTLEMENT_METADATA_KEY = "nmi_settlement"

export type NmiPaymentIdentity = {
  session_id: string
  transactionid: string
  payment_method: "ach" | "card"
  amount: unknown
  currency_code: string
  captured?: boolean
  canceled?: boolean
}

export type NmiSettlement = {
  version: 1
  source: "nmi-hmac-v1"
  payment_id: string
  provider_id: typeof NMI_PROVIDER_ID
  session_id: string
  transaction_id: string
  amount: string
  currency_code: string
  status: "settled" | "returned" | "late_returned"
  hold: boolean
  reconciliation_required: boolean
  event_id: string
  event_type: string
  received_at: string
  capture_recorded: boolean
}

// Medusa 2.21 persists Payment.metadata and payment_session_id, but omits them
// from PaymentDTO / UpdatePaymentDTO. Keep that compatibility detail local.
export type NmiSettlementPayment = {
  id: string
  provider_id: string
  amount: unknown
  currency_code: string
  data?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
  payment_session_id?: string
  payment_session?: { id: string } | null
  payment_collection_id?: string
  captured_at?: string | Date | null
  canceled_at?: string | Date | null
}

export function nmiError(message: string): never {
  throw new MedusaError(MedusaError.Types.NOT_ALLOWED, message)
}

/** Exact major-unit comparison; never round an unexpected gateway amount. */
export function nmiAmount(value: unknown): string {
  if (value === null || value === undefined || typeof value === "boolean" || value === "") {
    return nmiError("NMI amount is missing or invalid.")
  }
  try {
    const amount = new BigNumber(value as BigNumberInput).bigNumber
    if (!amount || !amount.isFinite() || !amount.isPositive() || amount.isZero() ||
      (amount.decimalPlaces() ?? 3) > 2) {
      return nmiError("NMI amount is missing or invalid.")
    }
    return amount.toFixed(2)
  } catch {
    return nmiError("NMI amount is missing or invalid.")
  }
}

/** Read the provider's authenticated authorization, never browser method flags. */
export function readNmiPaymentIdentity(
  data: Record<string, unknown> | null | undefined,
  securityKey = process.env.NMI_SECURITY_KEY
): NmiPaymentIdentity {
  const encoded = data?.nmi_state
  const signature = data?.nmi_signature
  if (!securityKey || typeof encoded !== "string" || typeof signature !== "string" ||
    !/^[a-f0-9]{64}$/.test(signature)) {
    return nmiError("NMI payment identity is unverified; reconcile before proceeding.")
  }
  const expected = createHmac("sha256", securityKey).update(`vetud-nmi-v1:${encoded}`).digest("hex")
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return nmiError("NMI payment identity is unverified; reconcile before proceeding.")
  }
  let state: NmiPaymentIdentity & { phase: string }
  try { state = JSON.parse(encoded) } catch {
    return nmiError("NMI payment identity is invalid.")
  }
  if (!state || state.phase !== "payment" || !/^payses_[a-zA-Z0-9_-]+$/.test(state.session_id) ||
    typeof state.transactionid !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(state.transactionid) ||
    !["ach", "card"].includes(state.payment_method) || !/^[a-z]{3}$/.test(state.currency_code)) {
    return nmiError("NMI payment identity is invalid.")
  }
  nmiAmount(state.amount)
  return state
}

export function assertNmiPaymentIdentity(payment: NmiSettlementPayment, state: NmiPaymentIdentity): void {
  const sessionId = payment.payment_session_id ?? payment.payment_session?.id
  if (payment.provider_id !== NMI_PROVIDER_ID || !sessionId || sessionId !== state.session_id ||
    nmiAmount(payment.amount) !== nmiAmount(state.amount) || payment.currency_code !== state.currency_code) {
    nmiError("NMI payment identity does not match its payment record.")
  }
}

/** Only payment METADATA is authoritative. Session/browser data cannot release a hold. */
export function getNmiSettlement(
  payment: NmiSettlementPayment,
  state: NmiPaymentIdentity
): NmiSettlement | undefined {
  assertNmiPaymentIdentity(payment, state)
  const record = payment.metadata?.[NMI_SETTLEMENT_METADATA_KEY] as NmiSettlement | undefined
  if (record === undefined || record === null) return undefined
  if (record.version !== 1 || record.source !== "nmi-hmac-v1" || record.payment_id !== payment.id ||
    record.provider_id !== NMI_PROVIDER_ID || record.session_id !== state.session_id ||
    record.transaction_id !== state.transactionid || record.amount !== nmiAmount(state.amount) ||
    record.currency_code !== state.currency_code || !["settled", "returned", "late_returned"].includes(record.status) ||
    record.hold !== (record.status !== "settled") || record.reconciliation_required !== record.hold ||
    typeof record.capture_recorded !== "boolean" || !/^[a-f0-9]{64}$/.test(record.event_id)) {
    return nmiError("NMI settlement metadata is inconsistent; reconciliation is required.")
  }
  return record
}

/** Call BEFORE the provider's captured shortcut, with a freshly read payment row. */
export function assertNmiAchCaptureAllowed(payment: NmiSettlementPayment, state: NmiPaymentIdentity): void {
  if (state.payment_method !== "ach") return
  const settlement = getNmiSettlement(payment, state)
  if (state.canceled || payment.canceled_at || settlement?.status !== "settled" || settlement.hold) {
    nmiError("ACH capture requires verified NMI settlement. Pending or returned debits remain on hold.")
  }
}

/** Admin capture is forbidden for ACH even after settlement; reconciliation owns it. */
export function assertNmiManualCaptureAllowed(payment: NmiSettlementPayment, amount?: unknown): void {
  if (payment.provider_id !== NMI_PROVIDER_ID) return
  const state = readNmiPaymentIdentity(payment.data)
  assertNmiPaymentIdentity(payment, state)
  if (state.payment_method === "ach") {
    nmiError("Do not manually capture ACH. NMI settlement reconciliation records capture automatically.")
  }
  if (amount !== undefined && nmiAmount(amount) !== nmiAmount(state.amount)) {
    nmiError("NMI supports full capture only. Capture the original authorized amount.")
  }
}

export function assertNmiPaymentCanFulfill(payment: NmiSettlementPayment, action: "fulfillment" | "shipment"): void {
  if (payment.provider_id !== NMI_PROVIDER_ID) return
  const state = readNmiPaymentIdentity(payment.data)
  assertNmiPaymentIdentity(payment, state)
  if (state.canceled || payment.canceled_at) nmiError("The NMI payment is canceled; reconcile before fulfillment.")
  if (state.payment_method === "ach") {
    const settlement = getNmiSettlement(payment, state)
    if (settlement?.status !== "settled" || settlement.hold || !settlement.capture_recorded || !payment.captured_at) {
      nmiError("ACH is pending, returned, or awaiting reconciliation. Fulfillment and shipment are on hold.")
    }
  } else if (action === "shipment" && (!payment.captured_at || !state.captured)) {
    nmiError("Capture the NMI card payment before creating a shipment.")
  }
}
