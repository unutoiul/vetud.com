"use client"

import type { HttpTypes } from "@medusajs/types"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import NorthEastIcon from "@mui/icons-material/NorthEast"
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
import { formatMoney } from "@/lib/product"
import OrderTotals from "../cart/OrderTotals"
import { ButtonLink } from "../common/links"

const ORDER_FIELDS =
  "id,display_id,email,currency_code,created_at,item_total,shipping_total,tax_total,discount_total,total,*items,*shipping_address,*shipping_methods"

function readStoredOrder(id: string): HttpTypes.StoreOrder | null {
  try {
    const stored = window.sessionStorage.getItem(`vetud_order_${id}`)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export default function OrderConfirmation() {
  const id = useSearchParams().get("id") ?? ""
  const [order, setOrder] = useState<HttpTypes.StoreOrder | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!id) return
    sdk.store.order
      .retrieve(id, { fields: ORDER_FIELDS })
      .then(({ order: fetched }) => {
        if (!cancelled) setOrder(fetched)
      })
      .catch(() => {
        if (cancelled) return
        // Fall back to the copy saved at checkout (same browser tab).
        const stored = readStoredOrder(id)
        if (stored) setOrder(stored)
        else setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (!order) {
    return failed || !id ? (
      <Alert severity="warning">
        We couldn&apos;t load this order. If you just placed it, check your email for the confirmation.
      </Alert>
    ) : (
      <Skeleton variant="rounded" height={360} />
    )
  }

  const number = order.display_id ? `#${order.display_id}` : order.id
  const address = order.shipping_address
  const bankLines = PAYMENT_BANK_DETAILS ? PAYMENT_BANK_DETAILS.split("|").map((line) => line.trim()) : []

  return (
    <Grid container spacing={{ xs: 4, md: 6 }}>
      <Grid size={{ xs: 12, md: 7 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <CheckCircleIcon sx={{ color: "success.main", fontSize: 32 }} />
          <Typography variant="h3" component="h2">
            Order {number} is reserved.
          </Typography>
        </Stack>
        <Typography sx={{ color: "text.secondary", mb: 4 }}>
          A confirmation with payment instructions is on its way to <strong>{order.email}</strong>.
          Your items are held for you; we ship as soon as your payment arrives.
        </Typography>

        <Paper variant="outlined" sx={{ p: 3, bgcolor: "brand.mintWash", borderColor: "brand.mint", mb: 4 }}>
          <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
            How to pay
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Amount due
              </Typography>
              <Typography sx={{ fontSize: 24, fontWeight: 700 }}>
                {formatMoney(Number(order.total ?? 0), order.currency_code)}
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

        <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
          What happens next
        </Typography>
        <Stack spacing={2}>
          {[
            ["01", "Send payment", "Transfer the amount due using your order number as reference."],
            ["02", "We confirm and pack", "Once the payment arrives we confirm by email and pack your order with lot documentation."],
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
        <Stack direction="row" spacing={1.5} sx={{ mt: 4 }}>
          <ButtonLink href="/shop" variant="contained" endIcon={<NorthEastIcon />}>
            Continue shopping
          </ButtonLink>
          <ButtonLink href={`/contact?subject=${encodeURIComponent(`Order ${number}`)}`} variant="outlined">
            Questions about this order
          </ButtonLink>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
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
                  {formatMoney(Number(item.unit_price) * Number(item.quantity), order.currency_code)}
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
              <Typography sx={{ mt: 0.5 }}>
                {[address.first_name, address.last_name].filter(Boolean).join(" ")}
                <br />
                {address.address_1}
                {address.address_2 ? `, ${address.address_2}` : ""}
                <br />
                {[address.postal_code, address.city, address.province].filter(Boolean).join(" ")},{" "}
                {address.country_code?.toUpperCase()}
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
