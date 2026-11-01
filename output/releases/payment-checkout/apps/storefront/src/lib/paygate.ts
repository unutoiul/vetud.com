import type { HttpTypes } from "@medusajs/types"
import { MEDUSA_BACKEND_URL } from "./config"

export const PAYGATE_CARD = "pp_paygate_card"
export const PAYGATE_CRYPTO = "pp_paygate_crypto"
export const isPaygate = (id?: string) => id === PAYGATE_CARD || id === PAYGATE_CRYPTO
export type PaygateConfig = { card: boolean; crypto: boolean }

export function paygateOrderLink(value?: string) {
  if (!value) return null
  try {
    const url = new URL(value)
    if (url.origin !== new URL(MEDUSA_BACKEND_URL).origin || !/^\/paygate\/checkout\/payses_[a-zA-Z0-9_-]+$/.test(url.pathname) || !/^[a-f0-9]{64}$/.test(url.searchParams.get("token") || "")) return null
    return url.href
  } catch { return null }
}

/** The API verifies the session and selects the configured hosted domain before redirecting. */
export function readPaygateRedirect(cart: HttpTypes.StoreCart) {
  const session = cart.payment_collection?.payment_sessions?.find(item => isPaygate(item.provider_id))
  const state = session?.data?.paygate as { session_id?: unknown; amount?: unknown; currency?: unknown; redirect_token?: unknown; canceled?: unknown } | undefined
  if (!session || !state || state.session_id !== session.id || typeof state.redirect_token !== "string" || !/^[a-f0-9]{64}$/.test(state.redirect_token) || state.canceled || Number(state.amount) !== Number(cart.total) || state.currency !== cart.currency_code.toUpperCase()) {
    throw new Error("Your payment details changed. Choose PayGate again before paying.")
  }
  const url = new URL(`/paygate/checkout/${encodeURIComponent(session.id)}`, MEDUSA_BACKEND_URL)
  url.searchParams.set("token", state.redirect_token)
  return { url: url.href }
}
