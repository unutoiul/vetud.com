"use client"

import Divider from "@mui/material/Divider"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useMoney } from "@/lib/money"

type Totals = {
  currency_code: string
  /** The *_subtotal fields are before discounts and taxes, so the rows add up; *_total already has the discount taken off. */
  item_subtotal?: number | null
  item_total?: number | null
  shipping_subtotal?: number | null
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
  const money = useMoney()
  const t = useTranslations("Checkout")
  const currency = totals.currency_code
  const shipping = Number(totals.shipping_subtotal ?? totals.shipping_total ?? 0)
  const discount = Number(totals.discount_total ?? 0)
  const tax = Number(totals.tax_total ?? 0)

  return (
    <Stack>
      <Row label={t("subtotal")} value={money(Number(totals.item_subtotal ?? totals.item_total ?? 0), currency)} />
      <Row
        label={t("shippingCost")}
        value={shippingKnown ? (shipping === 0 ? t("free") : money(shipping, currency)) : t("shippingPending")}
      />
      {discount > 0 ? <Row label={t("discount")} value={`−${money(discount, currency)}`} /> : null}
      {tax > 0 ? <Row label={t("tax")} value={money(tax, currency)} /> : null}
      <Divider sx={{ my: 1.5 }} />
      <Row label={shippingKnown ? t("total") : t("estimatedTotal")} value={money(Number(totals.total ?? 0), currency)} strong />
    </Stack>
  )
}
