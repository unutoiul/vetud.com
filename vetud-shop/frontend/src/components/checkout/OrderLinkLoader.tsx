"use client"

import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { sdk } from "@/lib/medusa/sdk"
import { ButtonLink, useLocalizedHref } from "../common/links"
import { CART_FIELDS, useStore } from "../store/StoreProvider"

/** Medusa cart ids: "cart_" and a ULID. Anything else can't be an order link. */
const CART_ID = /^cart_[0-9A-Za-z]{10,40}$/

type Problem = "invalid" | "ordered"

/**
 * An order link from the shop (Admin > Order links): a cart the owner filled for a customer who
 * ordered on WhatsApp. Makes it this visitor's cart and opens checkout, where they add their own
 * email, phone, address and payment.
 */
export default function OrderLinkLoader() {
  const ct = useContentTranslator()
  const params = useSearchParams()
  const router = useRouter()
  const localize = useLocalizedHref()
  const { cartReady, region, setCart } = useStore()
  const cartId = params.get("cart") ?? ""
  const valid = CART_ID.test(cartId)
  const [problem, setProblem] = useState<Problem | null>(null)
  const started = useRef(false)

  useEffect(() => {
    // Wait until the visitor's saved cart has loaded, so it can't replace the link's cart afterwards.
    if (!valid || !cartReady || started.current) return
    started.current = true
    const open = async () => {
      try {
        let { cart } = await sdk.store.cart.retrieve(cartId, { fields: CART_FIELDS })
        if (cart.completed_at) {
          setProblem("ordered")
          return
        }
        if (cart.region_id !== region.id) {
          ;({ cart } = await sdk.store.cart.update(cart.id, { region_id: region.id }, { fields: CART_FIELDS }))
        }
        setCart(cart)
        router.replace(localize("/checkout"))
      } catch {
        setProblem("invalid")
      }
    }
    void open()
  }, [valid, cartReady, cartId, region.id, setCart, router, localize])

  const shown = valid ? problem : "invalid"
  if (shown) {
    return (
      <Stack spacing={2.5} sx={{ maxWidth: 560, mx: "auto", alignItems: "flex-start" }}>
        <Alert severity={shown === "ordered" ? "success" : "warning"} sx={{ width: "100%" }}>
          {shown === "ordered"
            ? ct("This order has already been placed. Your confirmation email has the payment details.")
            : ct("This order link doesn't work any more. Message us and we'll send you a new one.")}
        </Alert>
        <ButtonLink href="/contact" variant="contained">
          {ct("Contact us")}
        </ButtonLink>
      </Stack>
    )
  }

  return (
    <Stack spacing={2} sx={{ alignItems: "center", py: 6 }} role="status" aria-live="polite">
      <CircularProgress size={32} />
      <Typography variant="body1" sx={{ color: "text.secondary" }}>
        {ct("Preparing your order…")}
      </Typography>
    </Stack>
  )
}
