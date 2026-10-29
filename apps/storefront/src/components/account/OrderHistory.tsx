"use client"

import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Chip from "@mui/material/Chip"
import Divider from "@mui/material/Divider"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { activeShipments, deliveryLabel, orderNumber, orderPaymentLabel, orderPaymentNotice, shipmentLabel, trackingLink, type CustomerOrder, type CustomerOrdersResponse } from "@/lib/orders"
import { useLocale } from "next-intl"
import { formatMoney } from "@/lib/product"
import { formatAddressLines } from "@/lib/address"
import PaygateResume from "../checkout/PaygateResume"
import Icon from "../brand/Icon"
import { ButtonLink } from "../common/links"

const PAGE_SIZE = 10
type HistoryState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CustomerOrdersResponse }

// The account boundary mounts this with a customer-ID key. Leaving the page or
// signing out cancels the UI update; another customer never inherits these orders.
export default function OrderHistory() {
  const [offset, setOffset] = useState(0)
  const [revision, setRevision] = useState(0)
  const [state, setState] = useState<HistoryState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    sdk.client.fetch<CustomerOrdersResponse>("/store/account/orders", {
      query: { offset, limit: PAGE_SIZE },
      cache: "no-store",
    }).then((data) => {
      if (!cancelled) setState({ status: "ready", data })
    }).catch((error: unknown) => {
      if (cancelled) return
      const expired = error && typeof error === "object" && "status" in error && error.status === 401
      setState({ status: "error", message: expired
        ? "Your session has expired. Please sign out and sign in again to view your orders."
        : "We couldn't load your orders. Please try again. Your orders have not been lost." })
    })
    return () => { cancelled = true }
  }, [offset, revision])

  const reload = (nextOffset = offset) => {
    setState({ status: "loading" })
    setOffset(nextOffset)
    setRevision((value) => value + 1)
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
        <Box>
          <Typography variant="h4" component="h2">Orders & tracking</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            Newest first, in each order&apos;s original currency. Open an order for its full details.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => reload()} disabled={state.status === "loading"} sx={{ alignSelf: "flex-start" }}>Refresh orders</Button>
      </Stack>

      {state.status === "loading" ? (
        <Stack spacing={2} role="status" aria-label="Loading orders">
          <Skeleton variant="rounded" height={180} /><Skeleton variant="rounded" height={180} />
        </Stack>
      ) : state.status === "error" ? (
        <Alert severity="error" action={<Button color="inherit" onClick={() => reload()}>Try again</Button>}>{state.message}</Alert>
      ) : (
        <>
          {state.data.orders.length ? state.data.orders.map((order) => <OrderCard key={order.id} order={order} />) : (
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
              <Icon name="package" sx={{ color: "secondary.main", fontSize: 32, mb: 1.5 }} />
              <Typography variant="h5" component="h3">{offset ? "No more orders on this page." : "No orders yet."}</Typography>
              <Typography sx={{ color: "text.secondary", mt: 1, mb: 3 }}>Orders placed while signed in will appear here. For an earlier guest order, use the tracking link in your shipping email or contact us.</Typography>
              <ButtonLink href="/shop" variant="contained">Browse the shop</ButtonLink>
            </Paper>
          )}
          {state.data.count > PAGE_SIZE || offset > 0 ? (
            <Stack component="nav" aria-label="Order history pages" direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" aria-live="polite">
                {state.data.orders.length ? `${offset + 1}–${offset + state.data.orders.length} of ${state.data.count} orders` : "End of order history"}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" disabled={offset === 0} onClick={() => reload(Math.max(0, offset - PAGE_SIZE))}>Previous</Button>
                <Button variant="outlined" disabled={offset + PAGE_SIZE >= state.data.count} onClick={() => reload(offset + PAGE_SIZE)}>Next</Button>
              </Stack>
            </Stack>
          ) : null}
        </>
      )}
      <Typography variant="body2" sx={{ color: "text.secondary" }}>Tracking appears when your shipment is prepared. Carrier scans can take time to appear after dispatch. Guest orders are not automatically added to an account by email address.</Typography>
    </Stack>
  )
}

function dateLabel(date: string | Date) {
  const value = new Date(date)
  return Number.isNaN(value.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(value)
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const number = orderNumber(order)
  const shipments = activeShipments(order)
  const address = order.shipping_address
  const paymentNotice = orderPaymentNotice(order)
  const locale = useLocale()
  const money = (amount: number | null | undefined) => formatMoney(Number(amount ?? 0), order.currency_code, { locale })

  return (
    <Paper component="article" aria-label={`Order ${number}`} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ p: { xs: 2.5, md: 3.5 }, bgcolor: "#f7f9fa" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h5" component="h3">Order {number}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{dateLabel(order.created_at)} · {(order.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0)} items</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20 }}>{money(order.total)} <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>{order.currency_code.toUpperCase()}</Box></Typography>
        </Stack>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mt: 2 }}>
          <Chip label={deliveryLabel(order)} size="small" color={order.fulfillment_status === "delivered" && order.status !== "canceled" ? "success" : "default"} />
          <Chip label={orderPaymentLabel(order)} size="small" variant="outlined" />
        </Stack>
      </Box>

      <Stack spacing={2} sx={{ px: { xs: 2.5, md: 3.5 }, py: 2.5 }}>
        {paymentNotice ? <Alert severity={order.payment_summary?.review === "pending_settlement" ? "info" : "warning"}>{paymentNotice}</Alert> : null}
        <PaygateResume checkoutUrl={order.payment_summary?.checkout_url} />
        {shipments.length ? shipments.map((shipment, index) => (
          <Box key={shipment.id}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Icon name="truck" sx={{ color: "secondary.main", fontSize: 19 }} />
              <Typography sx={{ fontWeight: 700 }}>Shipment {index + 1} · {shipmentLabel(shipment)}</Typography>
            </Stack>
            {shipment.delivered_at || shipment.shipped_at ? <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>{shipment.delivered_at ? `Delivered ${dateLabel(shipment.delivered_at)}` : `Dispatched ${dateLabel(shipment.shipped_at!)}`}</Typography> : null}
            {shipment.labels?.some((label) => label.tracking_number || trackingLink(label)) ? shipment.labels.map((label, labelIndex) => {
              const link = trackingLink(label)
              if (!label.tracking_number && !link) return null
              return (
                <Stack key={labelIndex} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mt: 1 }}>
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>Tracking number: <strong>{label.tracking_number || "See carrier"}</strong></Typography>
                  {link ? link.external ? (
                    <Button component="a" href={link.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" endIcon={<Icon name="arrowUpRight" sx={{ fontSize: 14 }} />} sx={{ flexShrink: 0, alignSelf: "flex-start" }}>Track package</Button>
                  ) : <ButtonLink href={link.href} sx={{ flexShrink: 0, alignSelf: "flex-start" }}>Track package</ButtonLink> : null}
                </Stack>
              )
            }) : <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>No tracking number yet. Please check back after dispatch.</Typography>}
          </Box>
        )) : <Typography variant="body2" sx={{ color: "text.secondary" }}>{order.status === "canceled" ? "This order was canceled. Contact us if you have a question about your refund." : "Your order hasn't shipped yet. Tracking details will appear here once a shipment is prepared."}</Typography>}
      </Stack>

      <Accordion disableGutters elevation={0} sx={{ borderTop: "1px solid", borderColor: "divider", "&::before": { display: "none" } }}>
        <AccordionSummary id={`${order.id}-summary`} aria-controls={`${order.id}-details`} expandIcon={<Icon name="chevronDown" />} sx={{ px: { xs: 2.5, md: 3.5 } }}>
          <Typography sx={{ fontWeight: 600 }}>View order details</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 2.5, md: 3.5 }, pb: 3.5 }}>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {(order.items ?? []).map((item) => (
              <Stack key={item.id} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box><Typography sx={{ fontWeight: 600 }}>{item.product_title || item.title}</Typography><Typography variant="body2" sx={{ color: "text.secondary" }}>{[item.variant_title, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}</Typography></Box>
                <Typography sx={{ whiteSpace: "nowrap" }}>{money(item.total ?? Number(item.unit_price) * Number(item.quantity))}</Typography>
              </Stack>
            ))}
          </Stack>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="eyebrow" sx={{ color: "text.secondary" }}>Shipping address</Typography>
              <Typography sx={{ whiteSpace: "pre-line", mt: 1 }}>{address ? formatAddressLines(address).join("\n") : "No shipping address required."}</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>{order.shipping_methods?.map((method) => method.name).join(", ")}</Typography>
              <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>{order.email}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                {[["Items", money(order.item_total)], ["Shipping", money(order.shipping_total)], ["Order total", money(order.total)]].map(([label, value]) => (
                  <Stack key={label} direction="row" sx={{ justifyContent: "space-between", gap: 2 }}><Typography sx={{ fontWeight: label === "Order total" ? 700 : 400 }}>{label}</Typography><Typography sx={{ fontWeight: 600 }}>{value}</Typography></Stack>
                ))}
                <Typography variant="body2" sx={{ color: "text.secondary" }}>Totals include {money(order.tax_total)} tax{Number(order.discount_total) > 0 ? ` and ${money(order.discount_total)} in discounts` : ""}.</Typography>
              </Stack>
            </Grid>
          </Grid>
          <ButtonLink href={`/contact?subject=${encodeURIComponent(`Order ${number}`)}`} variant="outlined" sx={{ mt: 3 }}>Get help with this order</ButtonLink>
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
}
