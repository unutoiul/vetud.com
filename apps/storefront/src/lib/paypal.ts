import type { HttpTypes } from "@medusajs/types"

export const PAYPAL_PROVIDER_ID = "pp_paypal_paypal"

export type PayPalConfig = {
  client_id: string
  environment: "sandbox" | "live"
  currency: string
  currency_supported: boolean
  paypal_enabled?: boolean
  paypal_title?: string
  intent?: "capture" | "authorize"
  button_color?: "gold" | "blue" | "silver" | "black" | "white"
  button_shape?: "rect" | "pill"
  button_height?: number
  button_label?: "paypal" | "checkout" | "buynow" | "pay" | "installment"
}

export function payPalAvailable(config: PayPalConfig | null, currency: string, allowSandbox = process.env.NODE_ENV !== "production") {
  return Boolean(config?.client_id && config.paypal_enabled !== false && config.currency_supported === true &&
    config.currency.toLowerCase() === currency.toLowerCase() && (config.environment === "live" || (allowSandbox && config.environment === "sandbox")))
}

/** A PayPal return must belong to this checkout before it can complete the cart. */
export function isPayPalReturnForCart(cart: HttpTypes.StoreCart, token: string | null) {
  const session = cart.payment_collection?.payment_sessions?.find(candidate => candidate.provider_id === PAYPAL_PROVIDER_ID)
  const paypal = session?.data?.paypal as { order_id?: string } | undefined
  return Boolean(token && paypal?.order_id === token && session?.currency_code === cart.currency_code &&
    Number(session.amount) === Number(cart.total) && Number(cart.total) > 0)
}

/** Bind approval to the addresses, items, delivery option and total the shopper reviewed. */
export function payPalCartFingerprint(cart: HttpTypes.StoreCart) {
  const address = (value: HttpTypes.StoreCart["shipping_address"]) =>
    (["first_name", "last_name", "address_1", "address_2", "city", "province", "postal_code", "country_code", "company", "phone"] as const).map(key => value?.[key] ?? "")
  return JSON.stringify([cart.id, cart.customer_id, cart.currency_code, Number(cart.total), cart.email,
    address(cart.shipping_address),
    cart.items?.map(item => [item.id, item.quantity, item.unit_price]),
    cart.shipping_methods?.map(method => [method.shipping_option_id, method.amount])])
}
