"use client"

import { CheckCircleIcon, ArrowUpRightIcon as NorthEastIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import { useEffect, useState } from "react"
import { PAYMENT_BANK_DETAILS } from "@/lib/config"
import { sdk } from "@/lib/medusa/sdk"
import { formatMoney } from "@/lib/product"
import { formatAddressLines } from "@/lib/address"
import { confirmationPayment } from "@/lib/nmi"
import { orderNumber, type CustomerOrder } from "@/lib/orders"
import { parseOrderReceipt } from "@/lib/order-receipt"
import OrderTotals from "../cart/OrderTotals"
import { ButtonLink } from "../common/links"
import { useAccount } from "../account/AccountProvider"

function readStoredOrder(id: string, customerId?: string): CustomerOrder | null {
  try {
    const stored = window.sessionStorage.getItem(`vetud_order_${id}`)
    return parseOrderReceipt(stored, id, customerId)
  } catch {
    return null
  }
}

export default function OrderConfirmation() {
  const { customer } = useAccount()
  const params = useSearchParams()
  const locale = useLocale()
  const id = params.get("id") ?? ""
  const [result, setResult] = useState<{ id: string; customerId?: string; order: CustomerOrder | null; authoritative: boolean }>({ id: "", order: null, authoritative: false })

  useEffect(() => {
    let cancelled = false
    if (!id) return
    sdk.client.fetch<{ order: CustomerOrder }>(`/store/account/orders/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then(({ order: fetched }) => {
        if (!cancelled) setResult({ id, customerId: customer?.id, order: fetched, authoritative: true })
      })
      .catch(() => {
        if (cancelled) return
        // Fall back to the copy saved at checkout (same browser tab).
        const stored = readStoredOrder(id, customer?.id)
        setResult({ id, customerId: customer?.id, order: stored, authoritative: false })
      })
    return () => {
      cancelled = true
    }
  }, [id, customer?.id])

  // A changed URL/account must never temporarily display the previous order.
  const current = result.id === id && result.customerId === customer?.id
  const order = current ? result.order : null
  const authoritative = current && result.authoritative

  if (!order) {
    return current || !id ? (
      <Alert severity="warning">
        We couldn&apos;t load this order. Sign in to the account used at checkout, or check your confirmation email.
      </Alert>
    ) : (
      <Skeleton variant="rounded" height={360} />
    )
  }

  const number = orderNumber(order)
  const { paid, manual, message } = confirmationPayment(order, authoritative)
  const address = order.shipping_address
  const bankLines = PAYMENT_BANK_DETAILS ? PAYMENT_BANK_DETAILS.split("|").map((line) => line.trim()) : []

  return (
    <Grid container spacing={{ xs: 4, md: 6 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <CheckCircleIcon sx={{ color: "success.main", fontSize: 32 }} />
          <Typography variant="h3" component="h2">
            {paid ? `Payment received for order ${number}.` : `Order ${number} received.`}
          </Typography>
        </Stack>
        <Typography sx={{ color: "text.secondary", mb: 4 }}>
          A confirmation is on its way to <strong>{order.email}</strong>. {message}
        </Typography>

        {manual ? (
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: "#eff5f6", borderRadius: 3, borderColor: "divider", mb: 4 }}>
          <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
            How to pay
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Amount due
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                {formatMoney(Number(order.total ?? 0), order.currency_code, { locale })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Payment reference
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-dm-mono), monospace" }}>
                {number}
              </Typography>
            </Grid>
          </Grid>
          {bankLines.length ? (
            <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "brand.mint" }}>
              {bankLines.map((line) => (
                <Typography key={line} variant="body2" sx={{ fontFamily: "var(--font-dm-mono), monospace" }}>
                  {line}
                </Typography>
              ))}
            </Box>
          ) : null}
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 2 }}>
            Please include the payment reference so we can match your transfer.
          </Typography>
        </Paper>
        ) : null}

        <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
          What happens next
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
                {step}
              </Typography>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {text}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
          <ButtonLink href={customer ? "/account/orders" : "/tracking"} variant="outlined">
            {customer ? "View my orders & tracking" : "Track a shipment"}
          </ButtonLink>
          <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
            Continue shopping
          </ButtonLink>
          <ButtonLink href={`/contact?subject=${encodeURIComponent(`Order ${number}`)}`} variant="outlined">
            Questions about this order
          </ButtonLink>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: "#f7f9fa", borderRadius: 3 }}>
          <Typography variant="h5" component="h3" sx={{ mb: 1 }}>
            Order {number}
          </Typography>
          <Box sx={{ mb: 2 }}>
            {(order.items ?? []).map((item) => (
              <Stack
                key={item.id}
                direction="row"
                sx={{ justifyContent: "space-between", py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{item.product_title ?? item.title}</Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {item.variant_title} · Qty {item.quantity}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>
                  {formatMoney(Number(item.unit_price) * Number(item.quantity), order.currency_code, { locale })}
                </Typography>
              </Stack>
            ))}
          </Box>
          <OrderTotals totals={order} shippingKnown />
          {address ? (
            <Box sx={{ mt: 3 }}>
              <Typography variant="eyebrow" sx={{ color: "text.secondary" }}>
                Shipping to
              </Typography>
              <Typography sx={{ mt: 0.5, whiteSpace: "pre-line" }}>
                {formatAddressLines(address).join("\n")}
              </Typography>
              {order.shipping_methods?.[0]?.name ? (
                <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
                  {order.shipping_methods[0].name}
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </Paper>
      </Grid>
    </Grid>
  )
}
