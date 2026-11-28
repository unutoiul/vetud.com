"use client"

import Box from "@mui/material/Box"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import Icon from "@/components/brand/Icon"
import OrderTotals from "@/components/cart/OrderTotals"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { formatAddressLines } from "@/lib/address"
import { useMoney } from "@/lib/money"
import { orderNumber, type CustomerOrder } from "@/lib/orders"
import { getProductThumbnail } from "@/lib/product-images"

/** A receipt groups the items, payment breakdown and delivery details into distinct sections. */
export default function OrderReceiptSummary({ order }: { order: CustomerOrder }) {
  const ct = useContentTranslator()
  const money = useMoney()
  const items = order.items ?? []
  const count = items.reduce((sum, item) => sum + Number(item.quantity), 0)
  const address = order.shipping_address
  const recipient = address ? [address.first_name, address.last_name].filter(Boolean).join(" ") : ""
  const addressLines = address ? formatAddressLines({ ...address, first_name: "", last_name: "" }) : []
  if (address?.country_code && /^[a-z]{2}$/i.test(address.country_code)) {
    addressLines[addressLines.length - 1] =
      new Intl.DisplayNames([ct.locale], { type: "region" }).of(address.country_code.toUpperCase()) ??
      address.country_code.toUpperCase()
  }
  const methods = (order.shipping_methods ?? []).map((method) => method.name).filter(Boolean)

  return (
    <Paper
      component="section"
      aria-labelledby="receipt-heading"
      variant="outlined"
      data-order-receipt
      sx={{ overflow: "hidden", borderRadius: "18px", borderColor: "brand.lineStrong", bgcolor: "background.paper" }}
    >
      <Stack
        direction="row"
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2.5,
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "brand.navy",
          color: "brand.onNavy",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ mb: 0.5, color: "brand.onNavyMuted", fontSize: 12.5 }}>{ct("Order summary")}</Typography>
          <Typography
            id="receipt-heading"
            component="h3"
            sx={{
              fontSize: { xs: 24, sm: 28 },
              lineHeight: 1.2,
              fontWeight: 600,
              letterSpacing: "-.03em",
              overflowWrap: "anywhere",
            }}
          >
            {ct.template("Order {v0}", { v0: orderNumber(order) })}
          </Typography>
        </Box>
        <Typography sx={{ flexShrink: 0, fontSize: 13, color: "brand.onNavy", fontVariantNumeric: "tabular-nums" }}>
          {ct.count(count, "item")}
        </Typography>
      </Stack>

      <Box sx={{ px: { xs: 2.5, sm: 3 }, pt: 0.5, pb: 3 }}>
        <Box component="ul" aria-label={ct("Ordered items")} sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map((item) => {
            const image = getProductThumbnail(item.product_handle, item.thumbnail, item.variant_title)
            return (
              <Box
                component="li"
                key={item.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: image
                    ? { xs: "56px minmax(0, 1fr)", sm: "64px minmax(0, 1fr) auto" }
                    : "minmax(0, 1fr) auto",
                  alignItems: "start",
                  columnGap: { xs: 1.5, sm: 2 },
                  rowGap: 0.5,
                  py: 2.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                {image ? (
                  <Box
                    sx={{
                      gridRow: "1 / 3",
                      position: "relative",
                      width: { xs: 56, sm: 64 },
                      aspectRatio: "1 / 1",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: "10px",
                      overflow: "hidden",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Image
                      src={image}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="64px"
                      style={{ objectFit: "contain", padding: 4 }}
                    />
                  </Box>
                ) : null}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, overflowWrap: "anywhere" }}>
                    {ct(item.product_title || item.title)}
                  </Typography>
                  {item.variant_title ? (
                    <Typography
                      sx={{ mt: 0.5, color: "text.secondary", fontSize: 13, lineHeight: 1.6, overflowWrap: "anywhere" }}
                    >
                      {ct(item.variant_title)}
                    </Typography>
                  ) : null}
                  <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: 12.5 }}>
                    {ct.template("Quantity: {v0}", { v0: item.quantity })}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    gridColumn: image ? { xs: 2, sm: 3 } : 2,
                    gridRow: image ? { xs: 2, sm: 1 } : 1,
                    pt: { xs: image ? 0.5 : 0, sm: 0 },
                    fontSize: 15,
                    fontWeight: 650,
                    lineHeight: 1.5,
                    whiteSpace: "nowrap",
                    textAlign: { xs: image ? "left" : "right", sm: "right" },
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ct(money(Number(item.unit_price) * Number(item.quantity), order.currency_code))}
                </Typography>
              </Box>
            )
          })}
        </Box>
        <Box sx={{ pt: 2 }}>
          <OrderTotals totals={order} shippingKnown variant="receipt" />
        </Box>
      </Box>

      {address || methods.length ? (
        <Box
          sx={{
            px: { xs: 2.5, sm: 3 },
            py: 3,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: "brand.mintWash",
          }}
        >
          {address ? (
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
              <Icon name="pin" sx={{ fontSize: 20, color: "brand.blue", mt: 0.25, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h4" sx={{ fontSize: 13, fontWeight: 600, color: "brand.navySoft", mb: 1 }}>
                  {ct("Shipping to")}
                </Typography>
                <Box
                  component="address"
                  sx={{ fontStyle: "normal", fontSize: 14, lineHeight: 1.7, overflowWrap: "anywhere" }}
                >
                  {recipient ? (
                    <Box component="span" sx={{ display: "block", fontWeight: 600, mb: 0.25 }}>
                      {recipient}
                    </Box>
                  ) : null}
                  {addressLines.map((line, index) => (
                    <Box component="span" key={index} sx={{ display: "block", color: "text.secondary" }}>
                      {line}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Stack>
          ) : null}
          {methods.length ? (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "flex-start",
                mt: address ? 2.5 : 0,
                pt: address ? 2.5 : 0,
                borderTop: address ? "1px solid" : "none",
                borderColor: "divider",
              }}
            >
              <Icon name="truck" sx={{ fontSize: 20, color: "brand.blue", mt: 0.25, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h4" sx={{ fontSize: 13, fontWeight: 600, color: "brand.navySoft", mb: 0.5 }}>
                  {ct("Delivery method")}
                </Typography>
                {methods.map((name, index) => (
                  <Typography key={index} sx={{ fontSize: 14, fontWeight: 500, overflowWrap: "anywhere" }}>
                    {ct(name)}
                  </Typography>
                ))}
              </Box>
            </Stack>
          ) : null}
        </Box>
      ) : null}
    </Paper>
  )
}
