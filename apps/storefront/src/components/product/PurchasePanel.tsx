"use client"

import type { HttpTypes } from "@medusajs/types"
import Icon, { FlaskIcon as ScienceOutlinedIcon, BagIcon as ShoppingBagOutlinedIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { useLocale } from "next-intl"
import { SITE } from "@/lib/config"
import { formatMoney, isVariantInStock, sortedVariants, variantPrice } from "@/lib/product"
import { defaultVariant, findVariant, FORMAT_OPTION, formatContents, formatLine, readOptions, selectionOf, variantsWith } from "@/lib/product-formats"
import { useStore } from "../store/StoreProvider"
import { useProductSelection } from "./ProductSelection"
import QuantityStepper from "./QuantityStepper"
import StockBadge from "./StockBadge"

export default function PurchasePanel({ product }: { product: HttpTypes.StoreProduct }) {
  const locale = useLocale()
  const { addItem, pending, error, clearError, region } = useStore()
  const { setFormat } = useProductSelection()
  const variants = sortedVariants(product)
  const options = readOptions(product)
  const firstAvailable = defaultVariant(product)
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const variant = variants.find((item) => item.id === variantId) ?? firstAvailable
  const selection = selectionOf(variant)
  const format = selection[FORMAT_OPTION]
  const contents = format ? formatContents(product, format) : undefined
  const price = variantPrice(variant)
  const inStock = isVariantInStock(variant)
  const maxQuantity =
    variant?.manage_inventory && !variant.allow_backorder
      ? Math.max(1, Math.min(99, variant.inventory_quantity ?? 1))
      : 99
  const threshold = region.freeShippingThreshold
  const money = (amount: number, currencyCode: string) => formatMoney(amount, currencyCode, { locale })

  // Keep the other choices when that combination exists; otherwise take the first variant with the new value.
  const choose = (title: string, value: string) => {
    const matching = variantsWith(product, title, value)
    const next = findVariant(product, { ...selection, [title]: value }) ?? matching.find(isVariantInStock) ?? matching[0]
    if (!next) return
    setVariantId(next.id)
    setQuantity(1)
    setAdded(false)
    if (title === FORMAT_OPTION) setFormat(value)
  }
  const lowestPrice = (title: string, value: string) => {
    const prices = variantsWith(product, title, value).flatMap((item) => variantPrice(item) ?? [])
    return prices.length ? prices.reduce((min, item) => (item.amount < min.amount ? item : min)) : null
  }

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
              {money(price.amount, price.currencyCode)}
            </Typography>
            {price.original > price.amount ? (
              <Typography sx={{ color: "text.secondary", textDecoration: "line-through" }}>
                {money(price.original, price.currencyCode)}
              </Typography>
            ) : null}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 20, fontWeight: 600 }}>Not available in your region</Typography>
        )}
        {options.length > 1 && variant ? (
          <Typography sx={{ color: "text.secondary", fontSize: 14, mt: 0.25 }}>{variant.title}</Typography>
        ) : null}
        {threshold ? (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Free standard shipping on orders over {formatMoney(threshold, region.currencyCode, { whole: true, locale })}
          </Typography>
        ) : null}
      </Box>

      {variants.length > 1
        ? options.map((option) =>
            option.title === FORMAT_OPTION ? (
              <Box key={option.title}>
                <Typography variant="eyebrow" component="p" id="format-label" sx={{ mb: 1.25, color: "text.secondary" }}>
                  Choose a format
                </Typography>
                <Box role="radiogroup" aria-labelledby="format-label" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${option.values.length}, 1fr)` }, gap: 1.25 }}>
                  {option.values.map((value) => {
                    const selected = value === format
                    const from = lowestPrice(option.title, value)
                    return (
                      <Box
                        key={value}
                        component="button"
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => choose(option.title, value)}
                        sx={{
                          position: "relative",
                          textAlign: "left",
                          font: "inherit",
                          color: "inherit",
                          cursor: "pointer",
                          p: 2,
                          pr: 5,
                          borderRadius: "8px",
                          border: "2px solid",
                          borderColor: selected ? "brand.blue" : "brand.lineStrong",
                          bgcolor: selected ? "brand.mintLight" : "#fff",
                          transition: "border-color .15s, background-color .15s",
                          "&:hover": { borderColor: "brand.blue" },
                          "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 },
                        }}
                      >
                        <Icon name={selected ? "checkCircle" : "plus"} aria-hidden sx={{ position: "absolute", top: 14, right: 14, fontSize: 20, color: selected ? "brand.blue" : "text.disabled" }} />
                        <Typography component="span" sx={{ display: "block", fontWeight: 700, fontSize: 16, color: "brand.ink" }}>{value}</Typography>
                        {formatLine(product, value) ? (
                          <Typography component="span" sx={{ display: "block", mt: 0.5, fontSize: 13, lineHeight: 1.5, color: "text.secondary" }}>{formatLine(product, value)}</Typography>
                        ) : null}
                        {from ? (
                          <Typography component="span" sx={{ display: "block", mt: 1, fontSize: 14, fontWeight: 600, color: "brand.ink" }}>from {money(from.amount, from.currencyCode)}</Typography>
                        ) : null}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            ) : (
              <Box key={option.title}>
                <Typography variant="eyebrow" component="p" id={`option-${option.title}`} sx={{ mb: 1.25, color: "text.secondary" }}>
                  {option.title}
                </Typography>
                <ToggleButtonGroup
                  exclusive
                  value={selection[option.title] ?? null}
                  onChange={(_, value: string | null) => {
                    if (value) choose(option.title, value)
                  }}
                  aria-labelledby={`option-${option.title}`}
                  sx={{ flexWrap: "wrap", gap: 1 }}
                >
                  {/* Only the amounts sold in the chosen format are offered. */}
                  {option.values
                    .map((value) => ({ value, match: findVariant(product, { ...selection, [option.title]: value }) }))
                    .filter(({ match }) => match)
                    .map(({ value, match }) => {
                      const available = isVariantInStock(match)
                      const matchPrice = options.length > 1 ? variantPrice(match) : null
                      return (
                        <ToggleButton
                          key={value}
                          value={value}
                          sx={{
                            px: 2.25,
                            py: 1,
                            minWidth: 92,
                            flexDirection: "column",
                            alignItems: "flex-start",
                            textTransform: "none",
                            fontWeight: 700,
                            lineHeight: 1.35,
                            border: "1px solid !important",
                            borderColor: "brand.lineStrong !important",
                            borderRadius: "5px !important",
                            bgcolor: "#fff",
                            "&.Mui-selected": {
                              bgcolor: "brand.mintLight",
                              borderColor: "brand.blue !important",
                              color: "brand.ink",
                            },
                            ...(available ? {} : { color: "text.disabled", textDecoration: "line-through" }),
                          }}
                        >
                          {value}
                          {matchPrice ? (
                            <Box component="span" sx={{ fontSize: 12, fontWeight: 500, color: "text.secondary" }}>
                              {money(matchPrice.amount, matchPrice.currencyCode)}
                            </Box>
                          ) : null}
                        </ToggleButton>
                      )
                    })}
                </ToggleButtonGroup>
              </Box>
            )
          )
        : null}

      {contents ? (
        <Stack direction="row" spacing={1.5} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "5px", p: 2 }}>
          <Icon name="package" fontSize="small" sx={{ color: "brand.blue", mt: "2px" }} />
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "brand.ink" }}>In the box · {format}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>{contents}</Typography>
          </Box>
        </Stack>
      ) : null}

      <Stack direction="row" spacing={1.5} useFlexGap role="status" aria-live="polite" aria-atomic="true" sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <StockBadge inStock={inStock} />
        {inStock ? (
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>
            {variant?.manage_inventory && (variant.inventory_quantity ?? 0) < 10
              ? `Only ${variant.inventory_quantity} left`
              : "Ships within 1–2 business days"}
          </Typography>
        ) : null}
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
        sx={{ bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "5px", p: 2 }}
      >
        <ScienceOutlinedIcon fontSize="small" sx={{ color: "secondary.main", mt: "2px" }} />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          <strong>{SITE.productDisclaimer}.</strong> {SITE.ruoNotice}
        </Typography>
      </Stack>
    </Stack>
  )
}
