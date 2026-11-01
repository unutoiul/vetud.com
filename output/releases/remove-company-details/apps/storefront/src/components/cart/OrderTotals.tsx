"use client"

import Divider from "@mui/material/Divider"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useLocale } from "next-intl"
import { formatMoney } from "@/lib/product"

type Totals = {
  currency_code: string
  item_total?: number | null
  shipping_total?: number | null
  tax_total?: number | null
  discount_total?: number | null
  total?: number | null
}

type OrderTotalsProps = {
  totals: Totals
  /** Before a delivery method is chosen, shipping shows as "Calculated at checkout". */
  shippingKnown: boolean
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", py: 0.75 }}>
      <Typography sx={{ color: strong ? "text.primary" : "text.secondary", fontWeight: strong ? 700 : 500 }}>{label}</Typography>
      <Typography sx={{ fontWeight: strong ? 700 : 600, fontSize: strong ? 18 : undefined, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
    </Stack>
  )
}

export default function OrderTotals({ totals, shippingKnown }: OrderTotalsProps) {
  const locale = useLocale()
  const currency = totals.currency_code
  const shipping = Number(totals.shipping_total ?? 0)
  const discount = Number(totals.discount_total ?? 0)
  const tax = Number(totals.tax_total ?? 0)

  return (
    <Stack>
      <Row label="Subtotal" value={formatMoney(Number(totals.item_total ?? 0), currency, { locale })} />
      <Row
        label="Shipping"
        value={shippingKnown ? (shipping === 0 ? "Free" : formatMoney(shipping, currency, { locale })) : "Calculated at checkout"}
      />
      {discount > 0 ? <Row label="Discount" value={`−${formatMoney(discount, currency, { locale })}`} /> : null}
      {tax > 0 ? <Row label="Tax" value={formatMoney(tax, currency, { locale })} /> : null}
      <Divider sx={{ my: 1.5 }} />
      <Row label={shippingKnown ? "Total" : "Estimated total"} value={formatMoney(Number(totals.total ?? 0), currency, { locale })} strong />
    </Stack>
  )
}
