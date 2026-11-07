"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"


import type { HttpTypes } from "@medusajs/types"
import Icon, { FlaskIcon as ScienceOutlinedIcon, BagIcon as ShoppingBagOutlinedIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import Stack from "@mui/material/Stack"
import ToggleButton from "@mui/material/ToggleButton"
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"
import Typography from "@mui/material/Typography"
import Image from "next/image"
import { useState } from "react"
import { SITE } from "@/lib/config"
import { isVariantInStock, percentOff, sortedVariants, variantPrice } from "@/lib/product"
import { useMoney } from "@/lib/money"
import { defaultVariant, findVariant, FORMAT_OPTION, formatContents, formatLine, readOptions, selectionOf, variantsWith } from "@/lib/product-formats"
import { useStore } from "../store/StoreProvider"
import { useProductSelection } from "./ProductSelection"
import QuantityStepper from "./QuantityStepper"
import StockBadge from "./StockBadge"
import AcceptedPaymentMethods from "../common/AcceptedPaymentMethods"

/** A supply offered next to the vial format: bacteriostatic water, U-100 syringes. */
export type PurchaseAddOn = { variantId: string; title: string; detail: string; unit?: string; image?: string; price: { amount: number; currencyCode: string } }

/** Formats that need water and syringes on the side. */
const ADD_ON_FORMATS = ["Vial"]

export default function PurchasePanel({ product, addOns = [] }: { product: HttpTypes.StoreProduct; addOns?: PurchaseAddOn[] }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const { addItem, pending, error, clearError, region } = useStore()
  const { setFormat } = useProductSelection()
  const variants = sortedVariants(product)
  const options = readOptions(product)
  const firstAvailable = defaultVariant(product)
  const [variantId, setVariantId] = useState(firstAvailable?.id ?? "")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  // Quantity of each add-on, by variant id; 0 or missing means not added.
  const [extras, setExtras] = useState<Record<string, number>>({})

  const variant = variants.find((item) => item.id === variantId) ?? firstAvailable
  const selection = selectionOf(variant)
  const format = selection[FORMAT_OPTION]
  const contents = format ? formatContents(product, format) : undefined
  const price = variantPrice(variant)
  const off = percentOff(price)
  const inStock = isVariantInStock(variant)
  const maxQuantity =
    variant?.manage_inventory && !variant.allow_backorder
      ? Math.max(1, Math.min(99, variant.inventory_quantity ?? 1))
      : 99
  const threshold = region.freeShippingThreshold
  const money = useMoney()

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

  const offered = format && ADD_ON_FORMATS.includes(format) ? addOns : []
  const chosen = offered.filter((addOn) => (extras[addOn.variantId] ?? 0) > 0)
  const extraCount = chosen.reduce((total, addOn) => total + extras[addOn.variantId], 0)
  const setExtra = (variantId: string, count: number) => setExtras((current) => ({ ...current, [variantId]: count }))

  const onAdd = async () => {
    if (!variant) return
    setAdded(false)
    let ok = await addItem(variant.id, quantity)
    for (const addOn of chosen) if (ok) ok = await addItem(addOn.variantId, extras[addOn.variantId])
    setAdded(ok)
  }

  return (
    <Stack spacing={3}>
      <Box>
        {price ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "baseline" }}>
            <Typography sx={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
              {ct(money(price.amount, price.currencyCode))}
            </Typography>
            {price.original > price.amount ? (
              <Typography sx={{ color: "text.secondary", textDecoration: "line-through" }}>{ct.rich("<slot0>Regular price </slot0>{v0}", { v0: ct(money(price.original, price.currencyCode)) }, { slot0: chunks => <Box component="span" sx={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }} key="slot0">{chunks}</Box> })}</Typography>
            ) : null}
            {off ? (
              <Typography component="span" sx={{ alignSelf: "center", fontSize: 13, fontWeight: 700, color: "#fff", bgcolor: "brand.navy", borderRadius: "4px", px: 1, py: 0.25 }}>
                {act("save")} {ct(off)}%
              </Typography>
            ) : null}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 20, fontWeight: 600 }}>{ct("Not available in your region")}</Typography>
        )}
        {options.length > 1 && variant ? (
          <Typography sx={{ color: "text.secondary", fontSize: 14, mt: 0.25 }}>{ct(variant.title)}</Typography>
        ) : null}
        {threshold ? (
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{ct.rich("Free standard shipping on orders over {v0}", { v0: ct(money(threshold, region.currencyCode, { whole: true })) }, {  })}</Typography>
        ) : null}
      </Box>

      {variants.length > 1
        ? options.map((option) =>
            option.title === FORMAT_OPTION ? (
              <Box key={option.title}>
                <Typography variant="eyebrow" component="p" id="format-label" sx={{ mb: 1.25, color: "text.secondary" }}>
                  {act("chooseFormat")}
                </Typography>
                {/* One row per format: name and what it is on the left, the starting price on the right. */}
                <Box role="radiogroup" aria-labelledby="format-label" sx={{ display: "grid", gap: 1 }}>
                  {option.values.map((value) => {
                    const selected = value === format
                    const from = lowestPrice(option.title, value)
                    const line = formatLine(product, value)
                    return (
                      <Box
                        key={value}
                        component="button"
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => choose(option.title, value)}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "24px minmax(0, 1fr) auto",
                          alignItems: "center",
                          columnGap: 1.5,
                          textAlign: "left",
                          font: "inherit",
                          color: "inherit",
                          cursor: "pointer",
                          px: 2,
                          py: 1.5,
                          borderRadius: "8px",
                          border: "2px solid",
                          borderColor: selected ? "brand.blue" : "brand.lineStrong",
                          bgcolor: selected ? "brand.mintLight" : "#fff",
                          transition: "border-color .15s, background-color .15s",
                          "&:hover": { borderColor: "brand.blue" },
                          "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 },
                        }}
                      >
                        <Box aria-hidden sx={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid", borderColor: selected ? "brand.blue" : "brand.lineStrong", display: "grid", placeItems: "center" }}>
                          {selected ? <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "brand.blue" }} /> : null}
                        </Box>
                        <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                          <Typography component="span" sx={{ display: "block", fontWeight: 700, fontSize: 15.5, color: "brand.ink" }}>{translateAction(act, value)}</Typography>
                          {line ? <Typography component="span" sx={{ display: "block", mt: 0.25, fontSize: 13, lineHeight: 1.45, color: "text.secondary" }}>{translateAction(act, line)}</Typography> : null}
                        </Box>
                        {from ? (
                          <Typography component="span" sx={{ fontSize: 14, fontWeight: 650, color: "brand.ink", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
                            <Box component="span" sx={{ display: "block", fontSize: 11, fontWeight: 500, color: "text.secondary" }}>{act("from")}</Box>
                            {ct(money(from.amount, from.currencyCode))}
                          </Typography>
                        ) : null}
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            ) : (
              <Box key={option.title}>
                <Typography variant="eyebrow" component="p" id={`option-${option.title}`} sx={{ mb: 1.25, color: "text.secondary" }}>
                  {translateAction(act, option.title)}
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
                          {translateAction(act, value)}
                          {matchPrice ? (
                            <Box component="span" sx={{ fontSize: 12, fontWeight: 500, color: "text.secondary" }}>
                              {ct(money(matchPrice.amount, matchPrice.currencyCode))}
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
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: "brand.ink" }}>{ct.rich("In the box · {v0}", { v0: ct(format) }, {  })}</Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.25 }}>{ct(contents)}</Typography>
          </Box>
        </Stack>
      ) : null}

      {offered.length ? (
        <Box component="fieldset" sx={{ m: 0, p: 2, border: "1px solid", borderColor: "divider", borderRadius: "5px", minWidth: 0 }}>
          <Typography component="legend" sx={{ px: 0.5, fontSize: 13, fontWeight: 700, color: "brand.ink" }}>{ct("Add what you need for the vial")}</Typography>
          <Box sx={{ display: "grid", gap: 1, mt: 0.5 }}>
            {offered.map((addOn) => {
              const count = extras[addOn.variantId] ?? 0
              const id = `add-on-${addOn.variantId}`
              return (
                <Box key={addOn.variantId} sx={{ display: "grid", gridTemplateColumns: "auto 44px minmax(0, 1fr) auto", alignItems: "center", columnGap: 1.25, rowGap: 1, p: 0.75, borderRadius: "6px", bgcolor: count ? "brand.mintLight" : "transparent", "&:hover": { bgcolor: count ? "brand.mintLight" : "brand.mintWash" } }}>
                  <Checkbox checked={count > 0} onChange={(event) => setExtra(addOn.variantId, event.target.checked ? 1 : 0)} size="small" sx={{ p: 0.5 }} slotProps={{ input: { id } }} />
                  <Box component="label" htmlFor={id} sx={{ position: "relative", width: 44, height: 44, borderRadius: "4px", overflow: "hidden", bgcolor: "#fff", border: "1px solid", borderColor: "divider", cursor: "pointer" }}>
                    {addOn.image ? <Image src={addOn.image} alt="" fill sizes="44px" style={{ objectFit: "contain" }} /> : null}
                  </Box>
                  <Box component="label" htmlFor={id} sx={{ minWidth: 0, cursor: "pointer" }}>
                    <Typography component="span" sx={{ display: "block", fontSize: 14, fontWeight: 650, color: "brand.ink" }}>{ct(addOn.title)}</Typography>
                    <Typography component="span" sx={{ display: "block", fontSize: 12.5, color: "text.secondary" }}>{ct(addOn.detail)} · {ct(money(addOn.price.amount, addOn.price.currencyCode))} {ct("each")}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 650, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>+{ct(money(addOn.price.amount * Math.max(count, 1), addOn.price.currencyCode))}</Typography>
                  {/* Once ticked, choose how many: more water for more vials. */}
                  {count ? (
                    <Box sx={{ gridColumn: "3 / -1", display: "flex", alignItems: "center", gap: 1.25 }}>
                      <QuantityStepper value={count} onChange={(value) => setExtra(addOn.variantId, value)} min={1} max={20} size="small" label={act("quantityAddOn", { product: addOn.title })} />
                      <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>{ct(addOn.unit ? `${count} ${addOn.unit}${count > 1 ? "s" : ""}` : null)}</Typography>
                    </Box>
                  ) : null}
                </Box>
              )
            })}
          </Box>
        </Box>
      ) : null}

      <Stack direction="row" spacing={1.5} useFlexGap role="status" aria-live="polite" aria-atomic="true" sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <StockBadge inStock={inStock} />
        {inStock && variant?.manage_inventory && (variant.inventory_quantity ?? 0) < 10 ? (
          <Typography variant="body2" sx={{ color: "text.secondary", fontSize: 13 }}>{ct.rich("Only {v0} left", { v0: ct(variant.inventory_quantity) }, {  })}</Typography>
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
          {ct(pending ? act("adding") : extraCount ? act("addItems", { count: extraCount + 1 }) : act("addCart"))}
        </Button>
      </Stack>

      {added ? (
        <Alert severity="success" role="status" onClose={() => setAdded(false)}>
          {ct("Added to your cart.")}
        </Alert>
      ) : null}
      <AcceptedPaymentMethods />
      {error ? (
        <Alert severity="error" onClose={clearError}>
          {ct(error)}
        </Alert>
      ) : null}

      <Stack
        direction="row"
        spacing={1.5}
        sx={{ bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "5px", p: 2 }}
      >
        <ScienceOutlinedIcon fontSize="small" sx={{ color: "secondary.main", mt: "2px" }} />
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          <strong>{ct(SITE.productDisclaimer)}.</strong> {ct(SITE.ruoNotice)}
        </Typography>
      </Stack>
    </Stack>
  )
}
