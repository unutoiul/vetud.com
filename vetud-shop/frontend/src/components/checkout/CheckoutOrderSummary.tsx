"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import type { HttpTypes } from "@medusajs/types"
import Badge from "@mui/material/Badge"
import Box from "@mui/material/Box"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import Icon from "@/components/brand/Icon"
import { SITE } from "@/lib/config"
import { useMoney } from "@/lib/money"
import { readProductMeta } from "@/lib/product"
import { getProductThumbnail } from "@/lib/product-images"
import OrderTotals from "../cart/OrderTotals"
import { ButtonLink } from "../common/links"
import AcceptedPaymentMethods from "../common/AcceptedPaymentMethods"
import ProductThumb from "../product/ProductThumb"

export default function CheckoutOrderSummary({ cart, place, arrival, compact = false }: { cart: HttpTypes.StoreCart; place: string; arrival: string | null; compact?: boolean }) {
  const ct = useContentTranslator()
  const t = useTranslations("Checkout")
  const money = useMoney()
  const count = (cart.items ?? []).reduce((sum, item) => sum + Number(item.quantity), 0)

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3 }}>
        <Box>
          {!compact ? <Typography component="h2" sx={{ fontSize: 19, fontWeight: 650, letterSpacing: "-.02em", mb: 0.5 }}>{t("summary")}</Typography> : null}
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>{t("itemCount", { count })}</Typography>
        </Box>
        <ButtonLink href="/cart" size="small" color="secondary" sx={{ minHeight: 44, flexShrink: 0, fontSize: 13 }}>{t("editCart")}</ButtonLink>
      </Stack>

      <Stack component="ul" spacing={2.5} sx={{ listStyle: "none", p: 0, m: 0, pb: 3, mb: 2.5, borderBottom: "1px solid", borderColor: "divider" }}>
        {(cart.items ?? []).map(item => {
          const quantity = Number(item.quantity)
          const meta = readProductMeta({ title: item.product_title ?? item.title, metadata: item.product?.metadata ?? null, categories: item.product?.categories ?? [] })
          const image = getProductThumbnail(item.product_handle, item.thumbnail, item.variant_title ?? null)
          return (
            <Stack component="li" key={item.id} direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
              <Badge badgeContent={quantity} color="primary" slotProps={{ badge: { "aria-label": t("qty", { count: quantity }) } }} sx={{ flexShrink: 0, "& .MuiBadge-badge": { fontSize: 11, minWidth: 21, height: 21, border: "2px solid", borderColor: "background.paper" } }}>
                <Box sx={{ width: 64, p: 0.5, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
                  <ProductThumb image={image} meta={meta} sizes="64px" />
                </Box>
              </Badge>
              <Box sx={{ flex: 1, minWidth: 0, pt: 0.25 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, overflowWrap: "anywhere" }}>{ct(item.product_title || item.title)}</Typography>
                <Typography sx={{ fontSize: 12.5, color: "text.secondary", mt: 0.5, lineHeight: 1.55 }}>{ct(item.variant_title)}</Typography>
              </Box>
              <Typography sx={{ pt: 0.25, fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{ct(money(Number(item.unit_price) * quantity, cart.currency_code))}</Typography>
            </Stack>
          )
        })}
      </Stack>

      <OrderTotals totals={cart} shippingKnown={Boolean(cart.shipping_methods?.length)} variant="checkout" pendingShippingLabel={t("shippingAfterAddress")} />

      {place ? (
        <Stack direction="row" spacing={1.25} sx={{ mt: 2.5, p: 1.5, bgcolor: "brand.mintWash", borderRadius: 2, alignItems: "flex-start" }}>
          <Icon name="truck" sx={{ fontSize: 17, color: "secondary.main", mt: 0.25 }} />
          <Typography sx={{ fontSize: 12.5, color: "text.secondary", lineHeight: 1.6, overflowWrap: "anywhere" }}>
            {t("deliveringTo", { place })}
            {arrival ? <><br />{t("arrives", { date: arrival })}</> : null}
          </Typography>
        </Stack>
      ) : null}

      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5, mt: 2.5, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "text.secondary" }}>
          <Icon name="lock" sx={{ fontSize: 14 }} />
          <Typography sx={{ fontSize: 12 }}>{t("secureCheckout")}</Typography>
        </Stack>
        <Box component="a" href={`mailto:${SITE.email}`} sx={{ color: "secondary.main", fontSize: 12, textUnderlineOffset: "3px", overflowWrap: "anywhere" }}>{ct(SITE.email)}</Box>
      </Stack>
      <Box sx={{ mt: 2.5 }}><AcceptedPaymentMethods regionId={cart.region_id || undefined} currency={cart.currency_code} /></Box>
    </Box>
  )
}
