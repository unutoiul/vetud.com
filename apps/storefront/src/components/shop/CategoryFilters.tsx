"use client"
import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"


import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import Icon from "@/components/brand/Icon"
import { shopQuery, type CategoryFacet } from "@/lib/catalog-filters"
import type { ProductSort } from "@/lib/medusa/products"

type Props = { categories: CategoryFacet[]; selected?: string; total: number; query?: string; sort: ProductSort }

const NOTE = "Themes make browsing easier; the products remain intended for laboratory research."

/** One-pick category list: "View all" plus each theme that has products, with counts. */
function CategoryList({ categories, selected, total, onPick, disabled }: Omit<Props, "query" | "sort"> & { onPick: (handle?: string) => void; disabled: boolean }) {
  const act = useTranslations("Actions")
  const options = [
    { handle: undefined, name: "View all", count: total },
    ...categories.filter((category) => category.group === "theme" && category.count > 0),
  ]
  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: .5 }}>
      {options.map((option) => {
        const active = option.handle === selected
        return (
          <Box component="li" key={option.handle ?? "all"}>
            <Box component="button" type="button" onClick={() => onPick(option.handle)} disabled={disabled} aria-pressed={active} sx={{ width: "100%", minHeight: 46, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, px: 1.75, border: 0, borderRadius: "10px", font: "inherit", fontSize: 15, fontWeight: 600, textAlign: "left", cursor: disabled ? "wait" : "pointer", bgcolor: active ? "brand.navy" : "transparent", color: active ? "#fff" : "text.primary", transition: "background-color .15s ease", "&:hover": { bgcolor: active ? "brand.navy" : "rgba(21,38,94,.06)" }, "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
              {translateAction(act, option.name)}
              <Box component="span" sx={{ minWidth: 30, px: .75, py: .25, borderRadius: "6px", textAlign: "center", fontSize: 13, fontVariantNumeric: "tabular-nums", bgcolor: active ? "rgba(255,255,255,.16)" : "#fff", color: active ? "#fff" : "text.secondary" }}>{option.count}</Box>
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}

export default function CategoryFilters({ categories, selected, total, query, sort }: Props) {
  const act = useTranslations("Actions")
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const current = categories.find((category) => category.handle === selected)
  const pick = (handle?: string) => {
    const params = shopQuery({ query, sort, categories: handle ? [handle] : [] })
    setOpen(false)
    startTransition(() => router.push(params ? `${pathname}?${params}` : pathname, { scroll: false }))
  }
  const reset = selected ? <Box component="button" type="button" onClick={() => pick()} sx={{ mt: 1.5, ml: 1, p: 0, border: 0, bgcolor: "transparent", font: "inherit", fontSize: 14, fontWeight: 600, color: "brand.blue", textDecoration: "underline", cursor: "pointer", minHeight: 32 }}>{act("clearFilters")}</Box> : null

  return <>
    <Box component="aside" aria-label={act("productCategories")} aria-busy={pending} sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 112, alignSelf: "start", bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "16px", p: 2.5 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", px: 1, mb: 1.5 }}>
        <Typography component="h2" sx={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.02em" }}>{act("category")}</Typography>
        <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>{total} {total === 1 ? "product" : "products"}</Typography>
      </Stack>
      <CategoryList categories={categories} selected={selected} total={total} onPick={pick} disabled={pending} />
      <Typography sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider", px: 1, fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>{NOTE}</Typography>
      {reset}
    </Box>

    <Button variant="outlined" disabled={pending} startIcon={<Icon name="sliders" />} onClick={() => setOpen(true)} sx={{ display: { xs: "inline-flex", lg: "none" }, justifySelf: "start", minHeight: 44 }}>
      {current ? act("categoryFilter", { name: translateAction(act, current.name) }) : act("category")}
    </Button>
    <Drawer anchor="left" open={open} onClose={() => setOpen(false)} slotProps={{ paper: { "aria-labelledby": "category-filter-title", sx: { width: "min(92vw, 380px)", p: 2.5, pt: "max(20px, env(safe-area-inset-top))", pb: "max(24px, env(safe-area-inset-bottom))", bgcolor: "brand.mintWash" } } }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", px: 1, mb: 1.5 }}>
        <Typography id="category-filter-title" component="h2" sx={{ fontSize: 22, fontWeight: 700 }}>{act("category")}</Typography>
        <IconButton aria-label={act("closeCategories")} onClick={() => setOpen(false)}><Icon name="close" /></IconButton>
      </Stack>
      <CategoryList categories={categories} selected={selected} total={total} onPick={pick} disabled={pending} />
      <Typography sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider", px: 1, fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>{NOTE}</Typography>
      {reset}
    </Drawer>
  </>
}
