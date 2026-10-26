"use client"

import type { HttpTypes } from "@medusajs/types"
import { CheckCircleIcon as CheckCircleOutlineIcon, FlaskIcon as ScienceOutlinedIcon, BagIcon as ShoppingBagOutlinedIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { SITE } from "@/lib/config"
import { formatMoney, isVariantInStock, sortedVariants, variantPrice } from "@/lib/product"
import { useStore } from "../store/StoreProvider"
import QuantityStepper from "./QuantityStepper"

export default function PurchasePanel({ product }: { product: HttpTypes.StoreProduct }) {
  const { addItem, pending, error, clearError, region } = useStore()
  const variants = sortedVariants(product)
  const firstAvailable = variants.find((variant) => isVariantInStock(variant)) ?? variants[0]
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const variant = variants.find((item) => item.id === variantId) ?? firstAvailable
  const price = variantPrice(variant)
  const inStock = isVariantInStock(variant)
  const maxQuantity =
    variant?.manage_inventory && !variant.allow_backorder
      ? Math.max(1, Math.min(99, variant.inventory_quantity ?? 1))
      : 99
  const optionTitle = variant?.options?.[0]?.option?.title ?? "Amount"
  const threshold = region.freeShippingThreshold

  const onAdd = async () => {
    if (!variant) return
    setAdded(false)
    const ok = await addItem(variant.id, quantity)
    setAdded(ok)
  }

  return (
    <Stack spacing={3}>
      <Box>
        {price ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline" }}>
            <Typography sx={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
              {formatMoney(price.amount, price.currencyCode)}
            </Typography>
            {price.original > price.amount ? (
              <Typography sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                {formatMoney(price.original, price.currencyCode)}
              </Typography>
            ) : null}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 20, fontWeight: 600 }}>Not available in your region</Typography>
        )}
        {threshold ? (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Free standard shipping on orders over {formatMoney(threshold, region.currencyCode, { whole: true })}
          </Typography>
        ) : null}
      </Box>

      {variants.length > 1 ? (
        <Box>
          <Typography variant="eyebrow" component="p" id="variant-label" sx={{ mb: 1.25, color: "text.secondary" }}>
            {optionTitle}
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={variant?.id}
            onChange={(_, value: string | null) => {
              if (value) {
                setVariantId(value)
                setQuantity(1)
                setAdded(false)
              }
            }}
            aria-labelledby="variant-label"
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {variants.map((item) => {
              const available = isVariantInStock(item)
              return (
                <ToggleButton
                  key={item.id}
                  value={item.id}
                  sx={{
                    px: 2.5,
                    py: 1.25,
                    textTransform: "none",
                    fontWeight: 700,
                    border: "1px solid !important",
                    borderColor: "brand.lineStrong !important",
                    borderRadius: "10px !important",
                    bgcolor: "#fff",
                    "&.Mui-selected": {
                      bgcolor: "brand.mintLight",
                      borderColor: "secondary.main !important",
                      color: "brand.ink",
                    },
                    ...(available ? {} : { color: "text.disabled", textDecoration: "line-through" }),
                  }}
                >
                  {item.title}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        </Box>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {inStock ? (
          <>
            <CheckCircleOutlineIcon fontSize="small" sx={{ color: "success.main" }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              In stock
              {variant?.manage_inventory && (variant.inventory_quantity ?? 0) < 10
                ? ` · only ${variant.inventory_quantity} left`
                : " · ships within 1–2 business days"}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 600, color: "error.main" }}>
            Out of stock
          </Typography>
        )}
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} disabled={!inStock || pending} />
        <Button
          variant="contained"
          size="large"
          startIcon={<ShoppingBagOutlinedIcon />}
          onClick={onAdd}
          disabled={!inStock || !price || pending}
          sx={{ flex: 1 }}
        >
          {pending ? "Adding…" : "Add to cart"}
        </Button>
      </Stack>

      {added ? (
        <Alert severity="success" role="status" onClose={() => setAdded(false)}>
          Added to your cart.
        </Alert>
      ) : null}
      {error ? (
        <Alert severity="error" onClose={clearError}>
          {error}
        </Alert>
      ) : null}

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: 2.5, p: 2 }}
      >
        <ScienceOutlinedIcon fontSize="small" sx={{ color: "secondary.main", mt: "2px" }} />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          <strong>{SITE.productDisclaimer}.</strong> {SITE.ruoNotice}
        </Typography>
      </Stack>
    </Stack>
  )
}
