import { createHash } from "node:crypto"
import { classifyAchEvent, extractSessionId, parseSignatureHeader, verifySignature } from "medusa-payment-nmi"
import { MedusaError } from "@medusajs/framework/utils"
import { nmiAmount, nmiError, NMI_WEBHOOK_PROVIDER } from "./nmi-settlement"
import type { NmiSettlement } from "./nmi-settlement"

export type NmiWebhookInput = {
  provider: string
  payload: {
    rawData: unknown
    headers: Record<string, unknown>
    data?: unknown
  }
}

export type VerifiedNmiEvent = {
  event_id: string
  event_type: string
  session_id: string
  transaction_id: string
  amount: string
  currency_code: string
  status: NmiSettlement["status"]
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function rawBody(value: unknown): string {
  if (typeof value === "string" && value.length) return value
  if (Buffer.isBuffer(value) && value.length) {
    const decoded = value.toString("utf8")
    if (Buffer.from(decoded, "utf8").equals(value)) return decoded
  }
  // Redis event serialization uses Node's Buffer JSON representation.
  const serialized = record(value)
  if (serialized.type === "Buffer" && Array.isArray(serialized.data) && serialized.data.length &&
    serialized.data.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
    return rawBody(Buffer.from(serialized.data))
  }
  throw new MedusaError(MedusaError.Types.INVALID_DATA, "NMI webhook requires the original raw request body.")
}

/** Verify the original bytes, then parse those same bytes. Ignore payload.data. */
export function verifyNmiWebhook(
  input: NmiWebhookInput,
  secret = process.env.NMI_WEBHOOK_SECRET,
  accountCurrency = process.env.NMI_ACCOUNT_CURRENCY
): VerifiedNmiEvent | null {
  if (input.provider !== NMI_WEBHOOK_PROVIDER) return null
  if (!secret) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "NMI webhook signing is not configured.")
  const raw = rawBody(input.payload?.rawData)
  const headers = Object.entries(input.payload?.headers ?? {}).filter(([key]) => key.toLowerCase() === "webhook-signature")
  const header = headers.length === 1 && typeof headers[0][1] === "string" ? headers[0][1] : undefined
  const parsed = parseSignatureHeader(header)
  if (!parsed || !/^[a-f0-9]{64}$/.test(parsed.signature) || !verifySignature(secret, raw, header)) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "NMI webhook signature verification failed.")
  }
  let payload: Record<string, unknown>
  try { payload = record(JSON.parse(raw)) } catch {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "NMI webhook body is invalid.")
  }
  if (typeof payload.event_type !== "string") nmiError("NMI webhook event type is missing.")
  const status = classifyAchEvent(payload.event_type)
  // Card results are synchronous. Generic sale/capture/batch events cannot settle ACH.
  if (!status) return null
  const body = record(payload.event_body)
  const action = record(body.action)
  const sessionId = extractSessionId(body)
  const references = [body.order_id, record(body.order).order_id, body.merchant_defined_field_1, record(body.merchant_defined_fields)["1"]]
    .filter((reference) => reference !== undefined && reference !== null)
  if (typeof sessionId !== "string" || !/^payses_[a-zA-Z0-9_-]+$/.test(sessionId) ||
    references.some((reference) => reference !== sessionId)) {
    nmiError("NMI webhook session references are missing or inconsistent.")
  }
  if (typeof body.transaction_id !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(body.transaction_id)) {
    nmiError("NMI webhook transaction identity is missing or invalid.")
  }
  const amount = nmiAmount(action.amount)
  if (body.requested_amount !== undefined && nmiAmount(body.requested_amount) !== amount) {
    nmiError("NMI webhook amounts do not match.")
  }
  const currency = accountCurrency?.toLowerCase()
  if (!currency || !/^[a-z]{3}$/.test(currency)) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "NMI account currency is not configured.")
  }
  for (const supplied of [body.currency, body.currency_code, action.currency, action.currency_code]) {
    if (supplied !== undefined && (typeof supplied !== "string" || supplied.toLowerCase() !== currency)) {
      nmiError("NMI webhook currency does not match the merchant account.")
    }
  }
  return {
    event_id: createHash("sha256").update(raw).digest("hex"),
    event_type: payload.event_type,
    session_id: sessionId,
    transaction_id: body.transaction_id,
    amount,
    currency_code: currency,
    status,
  }
}
