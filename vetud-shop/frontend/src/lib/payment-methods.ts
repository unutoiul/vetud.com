"use client"

import { sdk } from "./medusa/sdk"
import { MAKEPAY_PROVIDER_ID } from "./makepay"
import { PAYGATE_CARD, PAYGATE_CRYPTO, paygateAvailable, type PaygateConfig } from "./paygate"
import { NMI_PROVIDER_ID, nmiAvailable, type NmiConfig } from "./nmi"
import { PAYPAL_PROVIDER_ID, payPalAvailable, type PayPalConfig } from "./paypal"

export type PaymentMethod = "visa" | "mastercard" | "paypal" | "bank" | "crypto"
const cache = new Map<string, { expiresAt: number; promise: Promise<PaymentMethod[]> }>()

/** Public availability only; shared by every payment strip without loading gateway scripts. */
export function loadPaymentMethods(regionId: string, currency: string): Promise<PaymentMethod[]> {
  const key = `${regionId}:${currency.toLowerCase()}`
  const cached = cache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.promise
  const promise = Promise.all([
    sdk.store.payment.listPaymentProviders({ region_id: regionId }),
    sdk.client.fetch<NmiConfig>("/store/nmi/config", { method: "GET", cache: "no-store" }).catch(() => null),
    sdk.client.fetch<PayPalConfig>("/store/paypal/config", { method: "GET", cache: "no-store" }).catch(() => null),
    sdk.client.fetch<PaygateConfig>("/store/paygate/config", { method: "GET", cache: "no-store" }).catch(() => null),
  ]).then(([{ payment_providers }, nmi, paypal, paygate]) => {
    const providers = new Set(payment_providers.map(provider => provider.id))
    const methods: PaymentMethod[] = []
    if ((providers.has(NMI_PROVIDER_ID) && nmiAvailable(nmi, currency)) || (providers.has(PAYGATE_CARD) && paygateAvailable(paygate, PAYGATE_CARD))) methods.push("visa", "mastercard")
    // Without a cart the endpoint returns the merchant's default currency. Region membership
    // determines where the wallet is offered; the config still verifies its live connection.
    if (providers.has(PAYPAL_PROVIDER_ID) && payPalAvailable(paypal, paypal?.currency || currency)) methods.push("paypal")
    if (providers.has("pp_system_default")) methods.push("bank")
    if (providers.has(MAKEPAY_PROVIDER_ID) || (providers.has(PAYGATE_CRYPTO) && paygateAvailable(paygate, PAYGATE_CRYPTO))) methods.push("crypto")
    return methods
  }).catch(error => {
    cache.delete(key)
    throw error
  })
  if (cache.size >= 64) cache.delete(cache.keys().next().value!)
  cache.set(key, { expiresAt: Date.now() + 60_000, promise })
  return promise
}
