import type { HttpTypes } from "@medusajs/types"
import type { CustomerOrder } from "./orders"

export const NMI_PROVIDER_ID = "pp_nmi_primary"
export type NmiConfig = { enabled: boolean; currency_code: string | null; merchant_country: string | null; ach_enabled: boolean; wallets_enabled: boolean; sandbox: boolean }
export type NmiToken = { payment_token: string; payment_method: "card" | "ach"; account_type?: "checking" | "savings"; account_holder_type?: "personal" | "business"; ach_authorized?: boolean }
export type NmiSession = { id: string; tokenizationKey: string; sandbox: boolean; amount: number; currency: string; country: string; ach: boolean }

export function nmiAvailable(config: NmiConfig | null, currency: string) {
  return config?.enabled === true && config.currency_code === currency.toLowerCase()
}

export function readNmiSession(cart: HttpTypes.StoreCart): NmiSession | null {
  const session = cart.payment_collection?.payment_sessions?.find((item) => item.provider_id === NMI_PROVIDER_ID)
  const data = session?.data
  if (!session || !data || typeof data.tokenizationKey !== "string" || !data.tokenizationKey ||
    typeof data.sandbox !== "boolean" || data.currency_code !== cart.currency_code ||
    Number(data.amount) !== Number(cart.total) || !Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0 ||
    typeof data.merchant_country !== "string" || !/^[A-Z]{2}$/.test(data.merchant_country)) return null
  return { id: session.id, tokenizationKey: data.tokenizationKey, sandbox: data.sandbox,
    amount: Number(data.amount), currency: cart.currency_code.toUpperCase(), country: data.merchant_country,
    ach: data.ach_enabled === true && cart.currency_code === "usd" }
}

/** A token is only submitted for the exact order the shopper reviewed. */
export function nmiCartFingerprint(cart: HttpTypes.StoreCart) {
  const address = (value: HttpTypes.StoreCart["billing_address"]) =>
    (["first_name", "last_name", "address_1", "address_2", "city", "province", "postal_code", "country_code", "company", "phone"] as const)
      .map((key) => value?.[key] ?? "")
  return JSON.stringify([cart.id, cart.currency_code, Number(cart.total), cart.email,
    address(cart.billing_address), address(cart.shipping_address),
    cart.items?.map((item) => [item.id, item.quantity, item.unit_price]),
    cart.shipping_methods?.map((method) => [method.shipping_option_id, method.amount])])
}

/** Never infer payment success from a return URL's ?paid=1 flag. */
export function confirmationPayment(order: Pick<CustomerOrder, "payment_status" | "payment_summary">, authoritative = true) {
  if (!authoritative || !order.payment_summary) return { paid: false, manual: false, message: "Your order was received. Check your order history or confirmation email for its current payment status; do not submit another payment while it is being checked." }
  const summary = order.payment_summary
  if (summary.review === "returned" || summary.review === "requires_review") return { paid: false, manual: false, message: "Your payment needs review. Any unshipped items are on hold. Please contact support before submitting another payment." }
  if (summary.review === "canceled") return { paid: false, manual: false, message: "This payment was canceled. Contact support before attempting another payment." }
  if (summary.review === "pending_settlement") return { paid: false, manual: false, message: "Your bank debit was submitted and is awaiting settlement. No separate transfer is needed. Your order stays on hold until settlement is confirmed." }
  if (["refunded", "partially_refunded", "canceled"].includes(order.payment_status)) return { paid: false, manual: false, message: "Your payment has been refunded, partially refunded or canceled. View your order history for its current status, or contact support if you need help." }
  const paid = order.payment_status === "captured"
  const manual = ["not_paid", "awaiting", "authorized"].includes(order.payment_status) && summary.method === "manual"
  if (paid) return { paid, manual: false, message: "Your payment is confirmed. We will prepare your order and email you the tracking details when it ships." }
  if (summary.method === "nmi_ach") return { paid, manual: false, message: "Your bank debit was submitted and is awaiting settlement. No separate transfer is needed. Your order stays on hold until settlement is confirmed." }
  if (summary.method === "nmi_card" && order.payment_status === "authorized") return { paid, manual: false, message: "Your card payment is authorized. We will capture it when your order is ready to ship. No bank transfer is needed." }
  return { paid, manual, message: manual ? "Your items are reserved. Follow the bank-transfer instructions below; we ship after payment is confirmed." : "Check your order history or selected payment provider for the current payment status. Do not make an additional bank transfer." }
}
