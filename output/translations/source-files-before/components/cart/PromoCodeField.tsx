"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { CART_FIELDS, useStore } from "../store/StoreProvider"

/** Discount codes (for example from the sign-up pop-up), applied to the cart through Medusa promotions. */
export default function PromoCodeField() {
  const t = useTranslations("Offer")
  const { cart, setCart, isCurrentCart } = useStore()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  if (!cart) return null
  const applied = (cart.promotions ?? []).flatMap((promotion) => (promotion?.code ? [promotion.code] : []))

  const apply = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const wanted = code.trim().toUpperCase()
    if (!wanted) return
    setBusy(true)
    setError(null)
    try {
      const { cart: updated } = await sdk.store.cart.addPromotions(cart.id, { promo_codes: [wanted] }, { fields: CART_FIELDS })
      if (!isCurrentCart(cart.id)) return
      setCart(updated)
      // Medusa can accept the request but not apply an unknown or ineligible code.
      if (!(updated.promotions ?? []).some((promotion) => promotion?.code?.toUpperCase() === wanted)) setError(t("invalidCode"))
      else setCode("")
    } catch {
      setError(t("invalidCode"))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (promoCode: string) => {
    setBusy(true)
    setError(null)
    try {
      const { cart: updated } = await sdk.store.cart.removePromotions(cart.id, { promo_codes: [promoCode] }, { fields: CART_FIELDS })
      if (isCurrentCart(cart.id)) setCart(updated)
    } catch {
      setError(t("error"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Box component="form" onSubmit={apply} noValidate sx={{ display: "flex", gap: 1 }}>
        <TextField size="small" label={t("codeLabel")} name="promo_code" value={code} onChange={(event) => setCode(event.target.value)} slotProps={{ htmlInput: { autoComplete: "off", autoCapitalize: "characters", spellCheck: false, maxLength: 40 } }} />
        <Button type="submit" variant="outlined" disabled={busy || !code.trim()} sx={{ flexShrink: 0, height: 40, py: 0 }}>{busy ? t("applying") : t("apply")}</Button>
      </Box>
      {applied.length ? (
        <Stack spacing={.5} sx={{ mt: 1.5 }}>
          {applied.map((promoCode) => (
            <Stack key={promoCode} direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Chip label={promoCode} size="small" color="success" variant="outlined" sx={{ fontWeight: 650, letterSpacing: ".04em" }} />
              <Button size="small" onClick={() => void remove(promoCode)} disabled={busy} aria-label={`${t("remove")} ${promoCode}`}>{t("remove")}</Button>
            </Stack>
          ))}
        </Stack>
      ) : null}
      {error ? <Alert severity="warning" sx={{ mt: 1.5 }}>{error}</Alert> : null}
    </Box>
  )
}
