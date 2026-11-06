"use client"

import type { HttpTypes } from "@medusajs/types"
import { TrashIcon as DeleteOutlinedIcon } from "@/components/brand/Icon"
import Box from "@mui/material/Box"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { readProductMeta } from "@/lib/product"
import { useMoney } from "@/lib/money"
import { getProductThumbnail } from "@/lib/product-images"
import { LocalizedNextLink } from "../common/links"
import ProductThumb from "../product/ProductThumb"
import QuantityStepper from "../product/QuantityStepper"
import { useStore } from "../store/StoreProvider"

type CartLineItemProps = {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  readOnly?: boolean
  onNavigate?: () => void
}

export default function CartLineItem({ item, currencyCode, readOnly, onNavigate }: CartLineItemProps) {
  const act = useTranslations("Actions")
  const money = useMoney()
  const t = useTranslations("Checkout")
  const { updateItem, removeItem, pending } = useStore()
  const meta = readProductMeta({
    title: item.product_title ?? item.title,
    metadata: item.product?.metadata ?? null,
    categories: item.product?.categories ?? [],
  })
  const lineTotal = Number(item.unit_price) * Number(item.quantity)
  const image = getProductThumbnail(item.product_handle, item.thumbnail, item.variant_title ?? null)

  return (
    <Stack direction="row" spacing={2} sx={{ py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
      <Box
        component={LocalizedNextLink}
        href={`/products/${item.product_handle}`}
        onClick={onNavigate}
        sx={{
          width: { xs: 72, sm: 92 },
          flexShrink: 0,
          bgcolor: image ? "#fff" : "brand.mintWash",
          border: image ? "1px solid" : "none",
          borderColor: "divider",
          borderRadius: 2.5,
          p: image ? 0.5 : 1,
          alignSelf: "flex-start",
        }}
        aria-hidden
        tabIndex={-1}
      >
        <ProductThumb image={image} meta={meta} sizes="92px" />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component={LocalizedNextLink}
              href={`/products/${item.product_handle}`}
              onClick={onNavigate}
              sx={{ fontWeight: 600, textDecoration: "none", overflowWrap: "anywhere", "&:hover": { color: "secondary.main" } }}
            >
              {item.product_title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {item.variant_title} · {money(Number(item.unit_price), currencyCode)}
            </Typography>
            <Typography variant="mono" sx={{ color: "text.secondary", fontSize: 11 }}>
              {item.variant_sku ?? meta.code}
            </Typography>
          </Box>
          <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
            {money(lineTotal, currencyCode)}
          </Typography>
        </Stack>
        {readOnly ? (
          <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>
            {t("qty", { count: item.quantity })}
          </Typography>
        ) : (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, alignItems: "center" }}>
            <QuantityStepper
              size="small"
              value={Number(item.quantity)}
              disabled={pending}
              onChange={(quantity) => updateItem(item.id, quantity)}
              label={act("quantityProduct", { product: item.product_title ?? item.title })}
            />
            <IconButton
              aria-label={act("removeFromCart", { product: item.product_title ?? item.title })}
              disabled={pending}
              onClick={() => removeItem(item.id)}
              size="small"
            >
              <DeleteOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}
      </Box>
    </Stack>
  )
}
