"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

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
  variant?: "default" | "checkout" | "receipt"
  pendingShippingLabel?: string
}

function Row({
  label,
  value,
  strong,
  checkout,
  receipt,
}: {
  label: string
  value: string
  strong?: boolean
  checkout?: boolean
  receipt?: boolean
}) {
  const ct = useContentTranslator()
  const compact = checkout || receipt
  const labelSize = receipt ? 14 : checkout ? (strong ? 16 : 14) : undefined
  const valueSize = receipt
    ? strong
      ? { xs: 26, sm: 28 }
      : 14
    : strong
      ? checkout
        ? 24
        : 18
      : checkout
        ? 14
        : undefined
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ justifyContent: "space-between", alignItems: receipt && strong ? "center" : undefined, py: 0.75 }}
    >
      <Typography
        component="dt"
        sx={{
          m: 0,
          color: receipt && strong ? "brand.navy" : strong ? "text.primary" : "text.secondary",
          fontSize: labelSize,
          fontWeight: strong ? (checkout ? 600 : 700) : compact ? 400 : 500,
        }}
      >
        {ct(label)}
      </Typography>
      <Typography
        component="dd"
        sx={{
          m: 0,
          color: receipt && strong ? "brand.navy" : undefined,
          fontWeight: strong ? 700 : compact ? 500 : 600,
          fontSize: valueSize,
          maxWidth: receipt ? "65%" : checkout ? "60%" : undefined,
          overflowWrap: receipt ? "anywhere" : undefined,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
          lineHeight: strong ? 1.3 : undefined,
        }}
      >
        {ct(value)}
      </Typography>
    </Stack>
  )
}

export default function OrderTotals({ totals, shippingKnown, variant, pendingShippingLabel }: OrderTotalsProps) {
  const ct = useContentTranslator()
  const money = useMoney()
  const t = useTranslations("Checkout")
  const currency = totals.currency_code
  const shipping = Number(totals.shipping_subtotal ?? totals.shipping_total ?? 0)
  const discount = Number(totals.discount_total ?? 0)
  const tax = Number(totals.tax_total ?? 0)
  const checkout = variant === "checkout"
  const receipt = variant === "receipt"

  return (
    <Stack>
      <Stack component="dl" sx={{ m: 0 }}>
        <Row
          checkout={checkout}
          receipt={receipt}
          label={t("subtotal")}
          value={money(Number(totals.item_subtotal ?? totals.item_total ?? 0), currency)}
        />
        <Row
          label={t("shippingCost")}
          value={
            shippingKnown
              ? shipping === 0
                ? t("free")
                : money(shipping, currency)
              : pendingShippingLabel || t("shippingPending")
          }
          checkout={checkout}
          receipt={receipt}
        />
        {discount > 0 ? (
          <Row checkout={checkout} receipt={receipt} label={t("discount")} value={`−${money(discount, currency)}`} />
        ) : null}
        {tax > 0 ? <Row checkout={checkout} receipt={receipt} label={t("tax")} value={money(tax, currency)} /> : null}
      </Stack>
      {receipt ? null : <Divider sx={{ my: 1.5 }} />}
      <Stack
        component="dl"
        sx={{ m: 0, ...(receipt ? { mt: 2, p: 2, bgcolor: "brand.mintWash", borderRadius: "12px" } : {}) }}
      >
        <Row
          checkout={checkout}
          receipt={receipt}
          label={ct(shippingKnown ? t("total") : t("estimatedTotal"))}
          value={money(Number(totals.total ?? 0), currency)}
          strong
        />
      </Stack>
    </Stack>
  )
}
