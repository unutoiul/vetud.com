"use client"

import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { ButtonLink } from "../common/links"
import { useStore } from "../store/StoreProvider"

/**
 * Landing page after PayPal. The query string is ignored on purpose: the PayPal order lives on the
 * cart's payment session, and completing the cart makes the backend check it with PayPal and
 * capture the approved payment before the order is created.
 */
export default function PayPalReturn() {
  const router = useRouter()
  const cancelled = useSearchParams().get("cancelled") === "1"
  const { cart, cartReady, clearCart, countryCode } = useStore()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)
  const cartId = cart?.id

  useEffect(() => {
    if (!cartReady || cancelled || !cartId || started.current) return
    started.current = true
    sdk.store.cart
      .complete(cartId)
      .then((result) => {
        if (result.type !== "order") {
          setError("We couldn't confirm your PayPal payment, so no order was placed. You haven't been charged.")
          return
        }
        try {
          window.sessionStorage.setItem(`vetud_order_${result.order.id}`, JSON.stringify(result.order))
        } catch {
          // The confirmation page fetches the order when storage is unavailable.
        }
        clearCart()
        router.replace(`/${countryCode}/order/confirmed?id=${encodeURIComponent(result.order.id)}&paid=1`)
      })
      .catch(() => {
        setError("We couldn't confirm your PayPal payment, so no order was placed. You haven't been charged.")
      })
  }, [cartReady, cancelled, cartId, clearCart, router, countryCode])

  const message = cancelled
    ? { severity: "info" as const, text: "You cancelled the PayPal payment. Nothing was charged." }
    : error
      ? { severity: "warning" as const, text: error }
      : cartReady && !cartId
        ? {
            severity: "info" as const,
            text: "We couldn't find your cart. If you already paid, check your email for the order confirmation.",
          }
        : null

  if (!message) {
    return (
      <Stack spacing={2} sx={{ py: 8, alignItems: "center" }} role="status" aria-live="polite">
        <CircularProgress color="secondary" />
        <Typography>Confirming your PayPal payment…</Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={3} sx={{ py: 4, alignItems: "flex-start" }}>
      <Alert severity={message.severity}>{message.text}</Alert>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <ButtonLink href="/checkout" variant="contained">
          Back to checkout
        </ButtonLink>
        <ButtonLink href="/contact" variant="outlined">
          Contact us
        </ButtonLink>
      </Stack>
    </Stack>
  )
}
