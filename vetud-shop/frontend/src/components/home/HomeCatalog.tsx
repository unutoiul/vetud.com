"use client"

import type { HttpTypes } from "@medusajs/types"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useState } from "react"
import Icon from "@/components/brand/Icon"
import { ButtonLink } from "@/components/common/links"
import ProductGrid from "@/components/product/ProductGrid"
import { CategoryList } from "@/components/shop/CategoryFilters"
import { translateAction } from "@/i18n/actions"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { filterByCategories, type CategoryFacet } from "@/lib/catalog-filters"

/** Cards shown before "Show more": three rows of three. */
const FIRST_CARDS = 9

/** The home page catalog: pick a category on the left and the grid changes in place, without a page load. */
export default function HomeCatalog({ products, categories }: { products: HttpTypes.StoreProduct[]; categories: CategoryFacet[] }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const [selected, setSelected] = useState<string>()
  const [expanded, setExpanded] = useState(false)
  const themes = categories.filter((category) => category.group === "theme" && category.count > 0)
  const matching = filterByCategories(products, categories, selected ? [selected] : [])
  const shown = expanded ? matching : matching.slice(0, FIRST_CARDS)
  const pick = (handle?: string) => {
    setSelected(handle)
    setExpanded(false)
  }
  const options = [{ handle: undefined as string | undefined, name: "View all" }, ...themes]

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "300px minmax(0, 1fr)" }, alignItems: "start", gap: { xs: 2.5, lg: 5 } }}>
      <Box component="aside" aria-label={act("productCategories")} sx={{ display: { xs: "none", lg: "block" }, position: "sticky", top: 112, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "16px", p: 2.5 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "baseline", px: 1, mb: 1.5 }}>
          <Typography component="h3" sx={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.02em" }}>{act("category")}</Typography>
          <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>{ct(products.length)} {ct(products.length === 1 ? "product" : "products")}</Typography>
        </Stack>
        <CategoryList categories={categories} selected={selected} total={products.length} onPick={pick} disabled={false} />
      </Box>

      {/* Phones and tablets: the same choices as a row that scrolls sideways. */}
      <Box component="nav" aria-label={act("productCategories")} sx={{ display: { xs: "flex", lg: "none" }, gap: 1, overflowX: "auto", mx: { xs: -2, sm: 0 }, px: { xs: 2, sm: 0 }, pb: .5, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
        {options.map((option) => {
          const active = option.handle === selected
          return (
            <Box key={option.handle ?? "all"} component="button" type="button" onClick={() => pick(option.handle)} aria-pressed={active} sx={{ flexShrink: 0, minHeight: 44, px: 2, border: "1px solid", borderColor: active ? "brand.navy" : "divider", borderRadius: "999px", font: "inherit", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", bgcolor: active ? "brand.navy" : "background.paper", color: active ? "#fff" : "text.primary", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
              {translateAction(act, option.name)}
            </Box>
          )
        })}
      </Box>

      <Box sx={{ minWidth: 0 }} aria-live="polite">
        <ProductGrid products={shown} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: { xs: 3, md: 4 }, justifyContent: "center", alignItems: "center" }}>
          {shown.length < matching.length ? (
            <Button variant="outlined" onClick={() => setExpanded(true)} sx={{ minHeight: 44 }}>{act("moreItems", { count: matching.length - shown.length })}</Button>
          ) : null}
          <ButtonLink href={selected ? `/shop?category=${encodeURIComponent(selected)}` : "/shop"} variant="contained" endIcon={<Icon name="arrowUpRight" />} sx={{ minHeight: 44 }}>{act("shopCatalog")}</ButtonLink>
        </Stack>
      </Box>
    </Box>
  )
}
