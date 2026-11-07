"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import { useTranslations } from "next-intl"

import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { serializeOrderReceipt } from "@/lib/order-receipt"
import { isPayPalReturnForCart } from "@/lib/paypal"
import { ButtonLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import { useAccount } from "../account/AccountProvider"

/**
 * Match the returned token to the current PayPal session before completing a cart.
 * The backend still checks approval and capture with PayPal; the URL never proves payment.
 */
export default function PayPalReturn() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const router = useRouter()
  const params = useSearchParams()
  const cancelled = params.get("cancelled") === "1"
  const token = params.get("token")
  const { cart, cartReady, clearCart, isCurrentCart, countryCode } = useStore()
  const { captureSession, customer } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)
  const cartId = cart?.id
  const matchesCheckout = Boolean(cart && isPayPalReturnForCart(cart, token))

  useEffect(() => {
    if (!cartReady || cancelled || !cartId || !matchesCheckout || started.current) return
    started.current = true
    const assertSession = captureSession()
    sdk.client.fetch("/store/paypal/capture-order", { method: "POST", body: { cart_id: cartId, order_id: token } })
      .then(() => {
        assertSession()
        if (!isCurrentCart(cartId)) throw new Error("Your cart changed.")
        return sdk.store.cart.complete(cartId)
      })
      .then((result) => {
        assertSession()
        if (!isCurrentCart(cartId)) return
        if (result.type !== "order") {
          setError("We couldn't confirm the payment result yet. Check your order history or confirmation email before trying again.")
          return
        }
        try {
          const receipt = serializeOrderReceipt(result.order, customer?.id)
          if (receipt) window.sessionStorage.setItem(`vetud_order_${result.order.id}`, receipt)
        } catch {
          // The confirmation page fetches the order when storage is unavailable.
        }
        clearCart()
        router.replace(`/${countryCode}/order/confirmed?id=${encodeURIComponent(result.order.id)}`)
      })
      .catch(() => {
        setError("We couldn't confirm the payment result yet. Check your order history or confirmation email before trying again.")
      })
  }, [cartReady, cancelled, cartId, token, matchesCheckout, clearCart, isCurrentCart, captureSession, customer?.id, router, countryCode])

  const message = cancelled
    ? { severity: "info" as const, text: "PayPal checkout was cancelled. If you already approved a payment, check your order history before trying again." }
    : error
      ? { severity: "warning" as const, text: error }
      : cartReady && !cartId
        ? {
            severity: "info" as const,
            text: "We couldn't find your cart. If you already paid, check your email for the order confirmation.",
          }
        : cartReady && !matchesCheckout
          ? { severity: "warning" as const, text: "This PayPal return does not match your current checkout. Return to checkout to review your payment, or check your order history if you already paid." }
          : null

  if (!message) {
    return (
      <Stack spacing={2} sx={{ py: 8, alignItems: "center" }} role="status" aria-live="polite">
        <CircularProgress color="secondary" />
        <Typography>{ct("Confirming your PayPal payment…")}</Typography>
      </Stack>
    )
  }

  return (
    <Stack spacing={3} sx={{ py: 4, alignItems: "flex-start" }}>
      <Alert severity={message.severity}>{ct(message.text)}</Alert>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <ButtonLink href="/checkout" variant="contained">
          {act("backCheckout")}
        </ButtonLink>
        <ButtonLink href="/contact" variant="outlined">
          {act("contact")}
        </ButtonLink>
        <ButtonLink href="/account/orders" variant="outlined">{act("viewOrders")}</ButtonLink>
      </Stack>
    </Stack>
  )
}
