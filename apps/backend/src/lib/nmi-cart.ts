import { MedusaError } from "@medusajs/framework/utils"
import { NMI_PROVIDER_ID } from "./nmi-config"
import { nmiAmount } from "./nmi-settlement"

type Cart = {
  completed_at?: unknown
  total?: unknown
  currency_code: string
  email?: string | null
  billing_address?: Record<string, unknown> | null
  payment_collection?: { payment_sessions?: { id: string; provider_id: string; amount: unknown; currency_code: string; data?: Record<string, unknown> | null }[] | null } | null
}

/** Runs on the locked cart snapshot before any order/payment side effects. */
export function validateNmiCart(cart: Cart) {
  if (cart.completed_at) return
  const session = cart.payment_collection?.payment_sessions?.find((item) => item.provider_id === NMI_PROVIDER_ID)
  if (!session) return
  const fail = () => { throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Your order details changed. Review your order and re-enter your secure payment details.") }
  let state: Record<string, unknown>
  try { state = JSON.parse(String(session.data?.nmi_state)) } catch { return fail() }
  if (!state || state.phase !== "session" || state.session_id !== session.id ||
    session.currency_code !== cart.currency_code || state.currency_code !== cart.currency_code ||
    nmiAmount(session.amount) !== nmiAmount(cart.total) || nmiAmount(state.amount) !== nmiAmount(cart.total)) {
    return fail()
  }
  // Signature verification still occurs inside the provider. This check adds
  // freshness: a valid old signature must not authorize a newly edited cart.
  const billing = state.billing as Record<string, unknown> | undefined
  if (!billing || billing.email !== cart.email) return fail()
  for (const key of ["first_name", "last_name", "company", "address_1", "address_2", "city", "province", "postal_code", "country_code", "phone"]) {
    if ((billing[key] ?? "") !== (cart.billing_address?.[key] ?? "")) return fail()
  }
}
