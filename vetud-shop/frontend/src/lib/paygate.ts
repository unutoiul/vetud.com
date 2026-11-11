import type { HttpTypes } from "@medusajs/types"
import { MEDUSA_BACKEND_URL } from "./config"

export const PAYGATE_CARD = "pp_paygate_card"
export const PAYGATE_CRYPTO = "pp_paygate_crypto"
export const isPaygate = (id: string) => id === PAYGATE_CARD || id === PAYGATE_CRYPTO
export type PaygateConfig = { card: boolean; crypto: boolean }
export const paygateAvailable = (config: PaygateConfig | null, id: string) => id === PAYGATE_CARD ? config?.card === true : id === PAYGATE_CRYPTO && config?.crypto === true

export function paygateOrderLink(value: unknown): string | null {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    if (url.origin !== new URL(MEDUSA_BACKEND_URL).origin || url.username || url.password || url.hash || !/^\/paygate\/checkout\/payses_[a-zA-Z0-9_-]+$/.test(url.pathname) || !/^[a-f0-9]{64}$/.test(url.searchParams.get("token") || "") || [...url.searchParams.keys()].some(key => key !== "token") || url.searchParams.getAll("token").length !== 1) return null
    return url.href
  } catch { return null }
}

/** Browser checks aid recovery; the backend verifies the signed state and reserved order. */
export function readPaygateRedirect(cart: HttpTypes.StoreCart) {
  const session = cart.payment_collection?.payment_sessions?.find(item => isPaygate(item.provider_id))
  const state = session?.data?.paygate as { session_id?: string; amount?: string; currency?: string; redirect_token?: string; canceled?: boolean; settled?: boolean; review?: string } | undefined
  if (!session || !state || state.session_id !== session.id || !state.amount || !Number.isFinite(Number(state.amount)) || Number(state.amount) <= 0 || Number(state.amount) !== Number(cart.total) || state.currency?.toLowerCase() !== cart.currency_code.toLowerCase() || state.canceled || state.settled || state.review) throw new Error("Your payment changed. Choose PayGate again before placing the order.")
  const url = new URL(`/paygate/checkout/${encodeURIComponent(session.id)}`, MEDUSA_BACKEND_URL)
  url.searchParams.set("token", state.redirect_token || "")
  const safe = paygateOrderLink(url.href)
  if (!safe) throw new Error("Your payment changed. Choose PayGate again before placing the order.")
  return { url: safe }
}
