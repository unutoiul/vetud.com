"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import { useTranslations } from "next-intl"

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
import { useMoney } from "@/lib/money"
import { paygateOrderLink } from "@/lib/paygate"
import { formatAddressLines } from "@/lib/address"
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
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
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
          <Typography variant="h4" component="h2">{act("ordersTracking")}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            {ct("Newest first, in each order's original currency. Open an order for its full details.")}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => reload()} disabled={state.status === "loading"} sx={{ alignSelf: "flex-start" }}>{act("refreshOrders")}</Button>
      </Stack>

      {state.status === "loading" ? (
        <Stack spacing={2} role="status" aria-label={act("loadingOrders")}>
          <Skeleton variant="rounded" height={180} /><Skeleton variant="rounded" height={180} />
        </Stack>
      ) : state.status === "error" ? (
        <Alert severity="error" action={<Button color="inherit" onClick={() => reload()}>{act("retry")}</Button>}>{ct(state.message)}</Alert>
      ) : (
        <>
          {state.data.orders.length ? state.data.orders.map((order) => <OrderCard key={order.id} order={order} />) : (
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
              <Icon name="package" sx={{ color: "secondary.main", fontSize: 32, mb: 1.5 }} />
              <Typography variant="h5" component="h3">{ct(offset ? "No more orders on this page." : "No orders yet.")}</Typography>
              <Typography sx={{ color: "text.secondary", mt: 1, mb: 3 }}>{ct("Orders placed while signed in will appear here. For an earlier guest order, use the tracking link in your shipping email or contact us.")}</Typography>
              <ButtonLink href="/shop" variant="contained">{act("shopCatalog")}</ButtonLink>
            </Paper>
          )}
          {state.data.count > PAGE_SIZE || offset > 0 ? (
            <Stack component="nav" aria-label={act("orderPages")} direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" aria-live="polite">
                {ct(state.data.orders.length ? `${offset + 1}–${offset + state.data.orders.length} of ${state.data.count} orders` : "End of order history")}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" disabled={offset === 0} onClick={() => reload(Math.max(0, offset - PAGE_SIZE))}>{act("previous")}</Button>
                <Button variant="outlined" disabled={offset + PAGE_SIZE >= state.data.count} onClick={() => reload(offset + PAGE_SIZE)}>{act("next")}</Button>
              </Stack>
            </Stack>
          ) : null}
        </>
      )}
      <Typography variant="body2" sx={{ color: "text.secondary" }}>{ct("Tracking appears when your shipment is prepared. Carrier scans can take time to appear after dispatch. Guest orders are not automatically added to an account by email address.")}</Typography>
    </Stack>
  )
}

function dateLabel(date: string | Date, locale: string) {
  const value = new Date(date)
  return Number.isNaN(value.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(value)
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const number = orderNumber(order)
  const shipments = activeShipments(order)
  const address = order.shipping_address
  const paymentNotice = orderPaymentNotice(order)
  const format = useMoney()
  const money = (amount: number | null | undefined) => format(amount, order.currency_code)

  return (
    <Paper component="article" aria-label={ct.template("Order {v0}", { v0: number })} variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
      <Box sx={{ p: { xs: 2.5, md: 3.5 }, bgcolor: "#f7f9fa" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h5" component="h3">{ct.rich("Order {v0}", { v0: ct(number) }, {  })}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{ct(dateLabel(order.created_at, ct.locale))} · {ct.count((order.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0), "item")}</Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: 20 }}>{ct(money(order.total))} <Box component="span" sx={{ fontSize: 12, color: "text.secondary" }}>{ct(order.currency_code.toUpperCase())}</Box></Typography>
        </Stack>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap", mt: 2 }}>
          <Chip label={ct(deliveryLabel(order))} size="small" color={order.fulfillment_status === "delivered" && order.status !== "canceled" ? "success" : "default"} />
          <Chip label={ct(orderPaymentLabel(order))} size="small" variant="outlined" />
        </Stack>
      </Box>

      <Stack spacing={2} sx={{ px: { xs: 2.5, md: 3.5 }, py: 2.5 }}>
        {paymentNotice ? <Alert severity={order.payment_summary?.review === "pending_settlement" ? "info" : "warning"}>{ct(paymentNotice)}</Alert> : null}
        {paygateOrderLink(order.payment_summary?.checkout_url) ? <Button component="a" href={paygateOrderLink(order.payment_summary?.checkout_url)!} variant="contained" sx={{ alignSelf: "flex-start" }}>{ct("Continue payment with PayGate")}</Button> : null}
        {shipments.length ? shipments.map((shipment, index) => (
          <Box key={shipment.id}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Icon name="truck" sx={{ color: "secondary.main", fontSize: 19 }} />
              <Typography sx={{ fontWeight: 700 }}>{ct.rich("Shipment {v0} · {v1}", { v0: ct(index + 1), v1: ct(shipmentLabel(shipment)) }, {  })}</Typography>
            </Stack>
            {shipment.delivered_at || shipment.shipped_at ? <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>{shipment.delivered_at ? ct.template("Delivered {v0}", { v0: dateLabel(shipment.delivered_at, ct.locale) }) : ct.template("Dispatched {v0}", { v0: dateLabel(shipment.shipped_at!, ct.locale) })}</Typography> : null}
            {shipment.labels?.some((label) => label.tracking_number || trackingLink(label)) ? shipment.labels.map((label, labelIndex) => {
              const link = trackingLink(label)
              if (!label.tracking_number && !link) return null
              return (
                <Stack key={labelIndex} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mt: 1 }}>
                  <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{ct.rich("Tracking number: <slot0>{v0}</slot0>", { v0: ct(label.tracking_number || "See carrier") }, { slot0: chunks => <strong key="slot0">{chunks}</strong> })}</Typography>
                  {link ? link.external ? (
                    <Button component="a" href={link.href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" endIcon={<Icon name="arrowUpRight" sx={{ fontSize: 14 }} />} sx={{ flexShrink: 0, alignSelf: "flex-start" }}>{act("trackParcel")}</Button>
                  ) : <ButtonLink href={link.href} sx={{ flexShrink: 0, alignSelf: "flex-start" }}>{act("trackParcel")}</ButtonLink> : null}
                </Stack>
              )
            }) : <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>{ct("No tracking number yet. Please check back after dispatch.")}</Typography>}
          </Box>
        )) : <Typography variant="body2" sx={{ color: "text.secondary" }}>{ct(order.status === "canceled" ? "This order was canceled. Contact us if you have a question about your refund." : "Your order hasn't shipped yet. Tracking details will appear here once a shipment is prepared.")}</Typography>}
      </Stack>

      <Accordion disableGutters elevation={0} sx={{ borderTop: "1px solid", borderColor: "divider", "&::before": { display: "none" } }}>
        <AccordionSummary id={`${order.id}-summary`} aria-controls={`${order.id}-details`} expandIcon={<Icon name="chevronDown" />} sx={{ px: { xs: 2.5, md: 3.5 } }}>
          <Typography sx={{ fontWeight: 600 }}>{ct("View order details")}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: { xs: 2.5, md: 3.5 }, pb: 3.5 }}>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {(order.items ?? []).map((item) => (
              <Stack key={item.id} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                <Box><Typography sx={{ fontWeight: 600 }}>{ct(item.product_title || item.title)}</Typography><Typography variant="body2" sx={{ color: "text.secondary" }}>{[ct(item.variant_title), ct.template("Qty {v0}", { v0: item.quantity })].filter(Boolean).join(" · ")}</Typography></Box>
                <Typography sx={{ whiteSpace: "nowrap" }}>{ct(money(item.total ?? Number(item.unit_price) * Number(item.quantity)))}</Typography>
              </Stack>
            ))}
          </Stack>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="eyebrow" sx={{ color: "text.secondary" }}>{ct("Shipping address")}</Typography>
              <Typography sx={{ whiteSpace: "pre-line", mt: 1 }}>{address ? formatAddressLines(address).join("\n") : ct("No shipping address required.")}</Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>{order.shipping_methods?.map((method) => ct(method.name)).join(", ")}</Typography>
              <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>{ct(order.email)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack spacing={1}>
                {[["Items", money(order.item_total)], ["Shipping", money(order.shipping_total)], ["Order total", money(order.total)]].map(([label, value]) => (
                  <Stack key={label} direction="row" sx={{ justifyContent: "space-between", gap: 2 }}><Typography sx={{ fontWeight: label === "Order total" ? 700 : 400 }}>{ct(label)}</Typography><Typography sx={{ fontWeight: 600 }}>{ct(value)}</Typography></Stack>
                ))}
                <Typography variant="body2" sx={{ color: "text.secondary" }}>{ct.rich("Totals include {v0} tax{v1}.", { v0: ct(money(order.tax_total)), v1: ct(Number(order.discount_total) > 0 ? ` and ${money(order.discount_total)} in discounts` : "") }, {  })}</Typography>
              </Stack>
            </Grid>
          </Grid>
          <ButtonLink href={`/contact?subject=${encodeURIComponent(`Order ${number}`)}`} variant="outlined" sx={{ mt: 3 }}>{act("orderHelp")}</ButtonLink>
        </AccordionDetails>
      </Accordion>
    </Paper>
  )
}
