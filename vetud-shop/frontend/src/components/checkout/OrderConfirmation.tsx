"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import { useTranslations } from "next-intl"

import { CheckCircleIcon, ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { PAYMENT_BANK_DETAILS } from "@/lib/config"
import { sdk } from "@/lib/medusa/sdk"
import { useMoney } from "@/lib/money"
import { confirmationPayment } from "@/lib/nmi"
import { orderNumber, type CustomerOrder } from "@/lib/orders"
import { parseOrderReceipt, receiptCartId } from "@/lib/order-receipt"
import { ButtonLink } from "../common/links"
import { useAccount } from "../account/AccountProvider"
import GuestAccountOffer from "./GuestAccountOffer"
import OrderReceiptSummary from "./OrderReceiptSummary"
import { brand } from "@/theme/tokens"

/** The copy saved at checkout in this tab: the signed-in member's, or a guest's when customerId is omitted. */
function readStoredOrder(id: string, customerId?: string): CustomerOrder | null {
  try {
    const stored = window.sessionStorage.getItem(`vetud_order_${id}`)
    return parseOrderReceipt(stored, id, customerId)
  } catch {
    return null
  }
}

function readGuestCartId(id: string) {
  try {
    return receiptCartId(window.sessionStorage.getItem(`vetud_order_${id}`), id)
  } catch {
    return null
  }
}

export default function OrderConfirmation() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const { customer } = useAccount()
  const params = useSearchParams()
  const money = useMoney()
  const id = params.get("id") ?? ""
  const [result, setResult] = useState<{ id: string; customerId?: string; order: CustomerOrder | null; authoritative: boolean; guestCartId?: string | null }>({ id: "", order: null, authoritative: false })
  // Reloads the order after a guest puts it into an account.
  const [refreshes, setRefreshes] = useState(0)
  // Stays after the reload, when the order is shown from the new account.
  const [addedToAccount, setAddedToAccount] = useState(false)
  const customerId = customer?.id

  useEffect(() => {
    let cancelled = false
    if (!id) return
    sdk.client.fetch<{ order: CustomerOrder }>(`/store/account/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(({ order: fetched }) => {
        if (!cancelled) setResult({ id, customerId, order: fetched, authoritative: true })
      })
      .catch(() => {
        if (cancelled) return
        // Fall back to the copy saved at checkout (same browser tab): the member's, or a guest's.
        const memberCopy = customerId ? readStoredOrder(id, customerId) : null
        const guestCopy = memberCopy ? null : readStoredOrder(id)
        setResult({ id, customerId, order: memberCopy ?? guestCopy, authoritative: false, guestCartId: guestCopy ? readGuestCartId(id) : null })
      })
    return () => {
      cancelled = true
    }
  }, [id, customerId, refreshes])

  // A changed URL/account must never temporarily display the previous order.
  const current = result.id === id && result.customerId === customer?.id
  const order = current ? result.order : null
  const authoritative = current && result.authoritative

  if (!order) {
    return current || !id ? (
      <Alert severity="warning">
        {ct("We couldn't load this order. Sign in to the account used at checkout, or check your confirmation email.")}
      </Alert>
    ) : (
      <Skeleton variant="rounded" height={360} />
    )
  }

  const number = orderNumber(order)
  const { paid, manual, message } = confirmationPayment(order, authoritative)
  const bankLines = PAYMENT_BANK_DETAILS ? PAYMENT_BANK_DETAILS.split("|").map((line) => line.trim()) : []

  return (
    <Grid container spacing={{ xs: 4, md: 6 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <CheckCircleIcon sx={{ color: "success.main", fontSize: 32 }} />
          <Typography variant="h3" component="h2">
            {ct(paid ? `Payment received for order ${number}.` : `Order ${number} received.`)}
          </Typography>
        </Stack>
        <Typography sx={{ color: "text.secondary", mb: 4 }}>{ct.rich("A confirmation is on its way to <slot0>{v0}</slot0>. {v1}", { v0: ct(order.email), v1: ct(message) }, { slot0: chunks => <strong key="slot0">{chunks}</strong> })}</Typography>

        {manual ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: brand.slate50, borderRadius: 3, borderColor: "divider", mb: 4 }}>
          <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
            {ct("How to pay")}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {ct("Amount due")}
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                {ct(money(Number(order.total ?? 0), order.currency_code))}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {ct("Payment reference")}
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-dm-mono), monospace" }}>
                {ct(number)}
              </Typography>
            </Grid>
          </Grid>
          {bankLines.length ? (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "brand.mint" }}>
              {bankLines.map((line) => (
                <Typography key={line} variant="body2" sx={{ fontFamily: "var(--font-dm-mono), monospace" }}>
                  {ct(line)}
                </Typography>
              ))}
            </Box>
          ) : null}
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
            {ct("Please include the payment reference so we can match your transfer.")}
          </Typography>
        </Paper>
        ) : null}

        {addedToAccount ? (
          <Alert severity="success" sx={{ mb: 4 }}>{ct("Done. This order is now in your account, where you can follow it.")}</Alert>
        ) : result.guestCartId && order.email ? (
          <GuestAccountOffer orderId={order.id} email={order.email} cartId={result.guestCartId} onAdded={() => { setAddedToAccount(true); setRefreshes((count) => count + 1) }} />
        ) : null}

        <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
          {ct("What happens next")}
        </Typography>
        <Stack spacing={2}>
          {[
            ...(manual ? [["01", "Send payment", "Transfer the amount due using your order number as reference."]] : []),
            [
              "02",
              "We confirm and pack",
              paid
                ? "We confirm your order by email and pack it with lot documentation."
                : "Once the payment arrives we confirm by email and pack your order with lot documentation.",
            ],
            ["03", "Tracked delivery", "You receive a tracking link as soon as the parcel ships."],
          ].map(([step, title, text]) => (
            <Stack key={step} direction="row" spacing={2}>
              <Typography variant="mono" sx={{ color: "secondary.main", pt: "2px" }}>
                {ct(step)}
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{ct(title)}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {ct(text)}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
          <ButtonLink href={customer ? "/account/orders" : "/tracking"} variant="outlined">
            {ct(customer ? act("ordersTracking") : act("trackParcel"))}
          </ButtonLink>
          <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
            {act("continueShopping")}
          </ButtonLink>
          <ButtonLink href={`/contact?subject=${encodeURIComponent(`Order ${number}`)}`} variant="outlined">
            {act("orderHelp")}
          </ButtonLink>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <OrderReceiptSummary order={order} />
      </Grid>
    </Grid>
  )
}
