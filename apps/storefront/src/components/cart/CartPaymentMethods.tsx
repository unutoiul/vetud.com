"use client"

import Box from "@mui/material/Box"
import Image from "next/image"
import { useEffect, useState } from "react"
import Icon from "@/components/brand/Icon"
import { sdk } from "@/lib/medusa/sdk"
import { MAKEPAY_PROVIDER_ID } from "@/lib/makepay"
import { NMI_PROVIDER_ID, nmiAvailable, type NmiConfig } from "@/lib/nmi"
import { PAYPAL_PROVIDER_ID, payPalAvailable, type PayPalConfig } from "@/lib/paypal"

type Method = "visa" | "mastercard" | "paypal" | "bank" | "crypto"
const labels: Record<Method, string> = { visa: "Visa", mastercard: "Mastercard", paypal: "PayPal", bank: "Bank transfer", crypto: "Cryptocurrency" }

export default function CartPaymentMethods({ open, regionId, currency, cartId }: { open: boolean; regionId: string; currency: string; cartId?: string }) {
  const key = `${regionId}:${currency}:${cartId || ""}`
  const [loaded, setLoaded] = useState<{ key: string; methods: Method[] } | null>(null)
  const methods = loaded?.key === key ? loaded.methods : []

  useEffect(() => {
    if (!open || !regionId || !cartId) return
    let cancelled = false
    // Match checkout's availability checks; no payment SDKs are loaded for these logos.
    Promise.all([
      sdk.store.payment.listPaymentProviders({ region_id: regionId }),
      sdk.client.fetch<NmiConfig>("/store/nmi/config", { method: "GET", cache: "no-store" }).catch(() => null),
      sdk.client.fetch<PayPalConfig>("/store/paypal/config", { method: "GET", query: { cart_id: cartId }, cache: "no-store" }).catch(() => null),
    ]).then(([{ payment_providers }, nmi, paypal]) => {
      if (cancelled) return
      const providers = new Set(payment_providers.map(provider => provider.id))
      const available: Method[] = []
      // Read only the public configuration flag, avoiding Stripe's script loader in the cart.
      const cards = (providers.has("pp_stripe_stripe") && Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)) ||
        (providers.has(NMI_PROVIDER_ID) && nmiAvailable(nmi, currency))
      if (cards) available.push("visa", "mastercard")
      if (providers.has(PAYPAL_PROVIDER_ID) && payPalAvailable(paypal, currency)) available.push("paypal")
      if (providers.has("pp_system_default")) available.push("bank")
      if (providers.has(MAKEPAY_PROVIDER_ID)) available.push("crypto")
      setLoaded({ key, methods: available })
    }).catch(() => {
      if (!cancelled) setLoaded({ key, methods: [] })
    })
    return () => { cancelled = true }
  }, [open, regionId, currency, cartId, key])

  return (
    <Box sx={{ mt: 1.75, minHeight: 24 }}>
      {methods.length ? (
        <Box component="ul" aria-label="Accepted payment methods" sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 0.75, p: 0, m: 0, listStyle: "none" }}>
          {methods.map(method => (
            <Box component="li" key={method} sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              {method === "bank" || method === "crypto" ? (
                <Box role="img" aria-label={labels[method]} sx={{ height: 24, display: "flex", alignItems: "center", gap: 0.5, px: 0.75, border: "1px solid", borderColor: "divider", borderRadius: "3px", color: "text.secondary", fontSize: 12, lineHeight: 1, whiteSpace: "nowrap" }}>
                  <Icon name={method === "bank" ? "bank" : "wallet"} sx={{ fontSize: 14 }} />
                  <span aria-hidden="true">{method === "bank" ? "Bank" : "Crypto"}</span>
                </Box>
              ) : (
                <Image src={`/payment-methods/${method}.svg`} alt={labels[method]} width={38} height={24} loading="lazy" style={{ display: "block" }} />
              )}
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  )
}
