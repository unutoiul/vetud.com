import { BigNumber } from "@medusajs/framework/utils"
import type { PaymentDTO } from "@medusajs/framework/types"
import { createHmac, timingSafeEqual } from "node:crypto"
import { CallbackData, coinId } from "paygate-to"
import { PAYGATE_CARD, PAYGATE_CRYPTO, paygateError } from "./paygate-config"

export type PaygateReceipt = { transaction: string; coin: string; received: string; usd: string; payout: string }
export type PaygateState = {
  session_id: string; reference: string; cart_id: string; mode: "card" | "crypto";
  amount: string; currency: string; expected_usd: string; min_net_ratio: string; payout_wallets: string[];
  deposit_address: string; checkout_url: string; redirect_token: string; receipts: PaygateReceipt[];
  settled: boolean; canceled: boolean; review: string; mac?: string;
}

export function decimal(value: string) {
  if (!/^\d{1,40}(?:\.\d{1,80})?$/.test(value)) paygateError("Invalid payment amount.")
  return new BigNumber(value).bigNumber!
}

export const paygateTransaction = (id: string) => /^(?:0x)?[\da-f]{64}$/i.test(id) ? id.toLowerCase() : id

/** Session status remains authorized after native capture; inspect the payment ledger. */
export function findPaygateCapture(state: PaygateState, payments: PaymentDTO[]) {
  return payments.find(payment =>
    payment.provider_id === (state.mode === "card" ? PAYGATE_CARD : PAYGATE_CRYPTO) &&
    payment.payment_session?.id === state.session_id && !!payment.captured_at && !payment.canceled_at &&
    payment.currency_code.toUpperCase() === state.currency &&
    new BigNumber(payment.amount).bigNumber!.eq(decimal(state.amount)) &&
    (payment.captures ?? []).reduce((sum, capture) => sum.plus(new BigNumber(capture.amount).bigNumber!), decimal("0")).eq(decimal(state.amount)))
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`
  return JSON.stringify(value)
}

export function sealPaygate(state: PaygateState, secret: string): PaygateState {
  const { mac: _mac, ...data } = state
  return { ...data, mac: createHmac("sha256", secret).update(canonical(data)).digest("hex") }
}

export function readPaygate(data: Record<string, unknown> | null | undefined, secret: string): PaygateState {
  const state = data?.paygate as PaygateState | undefined
  if (!state || typeof state.mac !== "string" || !/^[a-f0-9]{64}$/.test(state.mac)) paygateError("The PayGate session is invalid. Choose payment again.")
  const expected = sealPaygate(state, secret).mac!
  if (!timingSafeEqual(Buffer.from(state.mac, "hex"), Buffer.from(expected, "hex"))) paygateError("The PayGate session was modified. Choose payment again.")
  return state
}

/** Validate before crediting; the provider signature and reference token are checked separately. */
export function paygateReceipt(state: PaygateState, data: CallbackData, usdPrice: string): PaygateReceipt {
  if (!data.coin || !data.txidIn || data.txidIn.length > 256 || !data.txidOut || !data.valueCoin || !data.valueForwardedCoin) paygateError("Incomplete PayGate settlement.")
  const received = decimal(data.valueCoin)
  const forwarded = decimal(data.valueForwardedCoin)
  if (!received.gt(0) || !forwarded.gt(0) || forwarded.gt(received)) paygateError("Invalid PayGate settlement amounts.")
  if (state.deposit_address && data.addressIn?.toLowerCase() !== state.deposit_address.toLowerCase()) paygateError("The deposit address does not match this checkout.")
  const payouts = data.payouts()
  // Normalize only EVM addresses. Base58/Bech32 addresses keep their original case.
  const normalize = (address: string) => address.startsWith("0x") ? address.toLowerCase() : address
  const payout = Object.entries(payouts).filter(([address]) => state.payout_wallets.some(wallet => normalize(wallet) === normalize(address))).reduce((sum, [, amount]) => sum.plus(decimal(amount)), decimal("0"))
  if (payout.lt(forwarded.times("0.98"))) paygateError("The configured merchant wallet did not receive the settlement.")
  return { transaction: paygateTransaction(data.txidIn), coin: coinId(data.coin), received: received.toFixed(), payout: payout.toFixed(), usd: received.times(decimal(usdPrice)).toFixed() }
}
