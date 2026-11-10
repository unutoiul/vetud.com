"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import Icon from "@/components/brand/Icon"
import { loadPaymentMethods, type PaymentMethod } from "@/lib/payment-methods"
import { useStore } from "../store/StoreProvider"

type Props = {
  regionId?: string
  currency?: string
  enabled?: boolean
  caption?: boolean
  align?: "left" | "center"
  tone?: "default" | "inverse"
}

export default function AcceptedPaymentMethods({ regionId, currency, enabled = true, caption = true, align = "center", tone = "default" }: Props) {
  const ct = useContentTranslator()
  const { region } = useStore()
  const t = useTranslations("Payments")
  const checkout = useTranslations("Checkout")
  const id = regionId || region.id
  const code = currency || region.currencyCode
  const key = `${id}:${code}`
  const [loaded, setLoaded] = useState<{ key: string; methods: PaymentMethod[] } | null>(null)
  const methods = loaded?.key === key ? loaded.methods : []

  useEffect(() => {
    if (!enabled || !id) return
    let cancelled = false
    loadPaymentMethods(id, code).then(methods => {
      if (!cancelled) setLoaded({ key, methods })
    }).catch(() => {
      if (!cancelled) setLoaded({ key, methods: [] })
    })
    return () => { cancelled = true }
  }, [enabled, id, code, key])

  if (!methods.length) return null
  const labels = { visa: "Visa", mastercard: "Mastercard", paypal: "PayPal", bank: checkout("payBank"), crypto: checkout("payCrypto") }
  return (
    <Box sx={{ textAlign: align }}>
      {caption ? <Typography sx={{ mb: 1, fontSize: 12, color: tone === "inverse" ? "brand.onNavyMuted" : "text.secondary" }}>{t("accepted")}</Typography> : null}
      <Box component="ul" aria-label={t("accepted")} sx={{ display: "flex", alignItems: "center", justifyContent: align === "left" ? "flex-start" : "center", flexWrap: "wrap", gap: 0.75, p: 0, m: 0, listStyle: "none" }}>
        {methods.map(method => (
          <Box component="li" key={method} sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            {method === "bank" || method === "crypto" ? (
              <Box role="img" aria-label={ct(labels[method])} sx={{ height: 24, display: "flex", alignItems: "center", gap: 0.5, px: 0.75, border: "1px solid", borderColor: "divider", borderRadius: "3px", bgcolor: "background.paper", color: "text.secondary", fontSize: 12, lineHeight: 1, whiteSpace: "nowrap" }}>
                <Icon name={method === "bank" ? "bank" : "wallet"} sx={{ fontSize: 14 }} />
                <span aria-hidden="true">{t(method)}</span>
              </Box>
            ) : (
              <Image src={`/payment-methods/${method}.svg`} alt={ct(labels[method])} width={38} height={24} loading="lazy" style={{ display: "block", background: "#fff", borderRadius: 3 }} />
            )}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
