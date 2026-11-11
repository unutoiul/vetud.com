"use client"

import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { useState } from "react"
import Icon from "@/components/brand/Icon"
import { ButtonLink, LocalizedNextLink } from "@/components/common/links"
import ProductArt from "@/components/product/ProductArt"
import { translateAction } from "@/i18n/actions"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { educationHref } from "@/lib/config"
import { useMoney } from "@/lib/money"
import { productsIn, type MenuProduct, type ProductMenuData } from "@/lib/product-menu"
import { NAV_LABEL_KEYS, SECONDARY_LINKS } from "./nav"

/** Products shown in the desktop menu before "View all", and in the phone menu. */
const PANEL_PRODUCTS = 9
const DRAWER_PRODUCTS = 6

const shopHref = (category?: string) => (category ? `/shop?category=${encodeURIComponent(category)}` : "/shop")

/** The product's vial photograph, or its drawn art when there is no photograph. */
export function MenuThumb({ product, size = 48 }: { product: MenuProduct; size?: number }) {
  return (
    <Box aria-hidden sx={{ position: "relative", width: size, height: size, flexShrink: 0, borderRadius: "8px", overflow: "hidden", border: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
      {product.image
        ? <Image src={product.image} alt="" fill sizes={`${size}px`} style={{ objectFit: "contain" }} />
        : <Box sx={{ position: "absolute", inset: 2 }}><ProductArt code={product.code} accent={product.accent} kind={product.artKind} /></Box>}
    </Box>
  )
}

/** Picture, name, code and lowest price: one product in a menu or the search list. */
export function MenuProductRow({ product, size = 48 }: { product: MenuProduct; size?: number }) {
  const ct = useContentTranslator()
  const t = useTranslations("Common")
  const money = useMoney()
  return <>
    <MenuThumb product={product} size={size} />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography component="span" sx={{ display: "block", fontWeight: 650, fontSize: 14, lineHeight: 1.35, color: "text.primary" }} noWrap>{ct(product.title)}</Typography>
      <Typography component="span" sx={{ display: "block", mt: .25, fontSize: 12, lineHeight: 1.4, color: "text.secondary" }} noWrap>
        {ct(product.code)}{product.price ? <> · {product.price.hasRange ? `${t("from")} ` : ""}<Box component="span" sx={{ color: "text.primary", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{ct(money(product.price.amount, product.price.currencyCode))}</Box></> : null}
      </Typography>
    </Box>
  </>
}

const productLinkSx = { display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, p: 1, borderRadius: "10px", textDecoration: "none", color: "inherit", transition: "background-color .15s", "&:hover, &:focus-visible": { bgcolor: "brand.mintWash" } }

/** The category picker: hovering, focusing or clicking a category shows its products. */
function CategoryPicker({ catalog, active, onPick, direction }: { catalog: ProductMenuData; active?: string; onPick: (handle?: string) => void; direction: "column" | "row" }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const options = [{ handle: undefined as string | undefined, name: act("allProducts"), count: catalog.products.length }, ...catalog.categories.map((category) => ({ ...category, name: translateAction(act, category.name) }))]
  return (
    <Box role="group" aria-label={act("productCategories")} sx={direction === "column"
      ? { display: "grid", gap: .25 }
      : { display: "flex", gap: 1, overflowX: "auto", mx: -3.5, px: 3.5, pb: .5, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
      {options.map((option) => {
        const selected = option.handle === active
        return (
          <Box
            key={option.handle ?? "all"}
            component="button"
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(option.handle)}
            onMouseEnter={direction === "column" ? () => onPick(option.handle) : undefined}
            onFocus={direction === "column" ? () => onPick(option.handle) : undefined}
            sx={direction === "column" ? {
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, width: "100%", minHeight: 40, px: 1.5,
              border: 0, borderRadius: "8px", font: "inherit", fontSize: 14, fontWeight: selected ? 700 : 500, textAlign: "left", cursor: "pointer",
              bgcolor: selected ? "brand.mintWash" : "transparent", color: selected ? "brand.navy" : "text.primary",
              "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: -2 },
            } : {
              flexShrink: 0, minHeight: 40, px: 1.75, border: "1px solid", borderColor: selected ? "brand.navy" : "divider", borderRadius: 999,
              font: "inherit", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer",
              bgcolor: selected ? "brand.navy" : "background.paper", color: selected ? "#fff" : "text.primary",
              "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 },
            }}
          >
            <span>{option.name}</span>
            {direction === "column" ? <Typography component="span" sx={{ fontSize: 12, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>{ct(option.count)}</Typography> : null}
          </Box>
        )
      })}
    </Box>
  )
}

/** The desktop "Products" panel under the header: categories on the left, their products on the right. */
export function ProductMegaMenu({ id, catalog, onNavigate }: { id: string; catalog: ProductMenuData; onNavigate: () => void }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  const [category, setCategory] = useState<string>()
  const products = productsIn(catalog, category)
  const shown = products.slice(0, PANEL_PRODUCTS)
  const categoryName = category ? catalog.categories.find((item) => item.handle === category)?.name : undefined

  return (
    <Box id={id} role="region" aria-label={act("products")} sx={{ position: "absolute", left: 0, right: 0, top: "100%", bgcolor: "#fff", borderBottom: "1px solid", borderColor: "divider", boxShadow: "0 28px 48px rgba(16, 42, 67, .14)", color: "text.primary" }}>
      <Box sx={{ maxWidth: 1488, mx: "auto", px: 6, pt: 3.5, pb: 3, display: "grid", gridTemplateColumns: "250px minmax(0, 1fr)", gap: 5 }}>
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue", px: 1.5, mb: 1.25 }}>{act("productCategories")}</Typography>
          <CategoryPicker catalog={catalog} active={category} onPick={setCategory} direction="column" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, mb: 1.5, px: 1 }}>
            <Typography component="p" sx={{ fontSize: 17, fontWeight: 700, letterSpacing: "-.02em" }}>
              {categoryName ? translateAction(act, categoryName) : act("allProducts")}
              <Box component="span" sx={{ ml: 1, fontSize: 13, fontWeight: 500, color: "text.secondary" }}>{ct(products.length)} {ct(products.length === 1 ? "product" : "products")}</Box>
            </Typography>
            <Box component={LocalizedNextLink} href={shopHref(category)} onClick={onNavigate} sx={{ display: "inline-flex", alignItems: "center", gap: .75, fontSize: 13.5, fontWeight: 650, color: "brand.blue", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              {act("viewAll")} <Icon name="arrowRight" sx={{ fontSize: 16 }} />
            </Box>
          </Box>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: .5 }}>
            {shown.map((product) => (
              <li key={product.id}>
                <Box component={LocalizedNextLink} href={`/products/${product.handle}`} onClick={onNavigate} sx={productLinkSx}>
                  <MenuProductRow product={product} size={52} />
                </Box>
              </li>
            ))}
          </Box>
          {products.length > shown.length ? (
            <ButtonLink href={shopHref(category)} onClick={onNavigate} variant="outlined" endIcon={<Icon name="arrowRight" />} sx={{ mt: 2, ml: 1, minHeight: 40 }}>
              {ct.template("See all {v0} products", { v0: products.length })}
            </ButtonLink>
          ) : null}
        </Box>
      </Box>
      <Box sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "brand.mintWash" }}>
        <Box sx={{ maxWidth: 1488, mx: "auto", px: 6, py: 1.25, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, fontSize: 13 }}>
          {SECONDARY_LINKS.map((link) => (
            <Box key={link.href} component={LocalizedNextLink} href={link.href} onClick={onNavigate} sx={{ display: "inline-flex", alignItems: "center", minHeight: 36, color: "text.secondary", textDecoration: "none", "&:hover": { color: "brand.blue" } }}>{t(NAV_LABEL_KEYS[link.href])}</Box>
          ))}
          <Box component="a" href={educationHref("/learn")} sx={{ ml: "auto", display: "inline-flex", alignItems: "center", gap: .5, minHeight: 36, color: "text.secondary", textDecoration: "none", "&:hover": { color: "brand.blue" } }}>
            {ct("Peptide guides on vetud.com")} <Icon name="arrowUpRight" sx={{ fontSize: 15 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

/** The phone menu's product section: category chips, then that category's products. */
export function ProductMenuSection({ catalog, onNavigate, onSearch }: { catalog: ProductMenuData; onNavigate: () => void; onSearch: () => void }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const [category, setCategory] = useState<string>()
  const products = productsIn(catalog, category)
  const shown = products.slice(0, DRAWER_PRODUCTS)

  return (
    <Box component="section" aria-labelledby="menu-products-title">
      <Box component="button" type="button" onClick={onSearch} sx={{ display: "flex", alignItems: "center", gap: 1.25, width: "100%", minHeight: 48, px: 2, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 999, bgcolor: "#fff", font: "inherit", fontSize: 14.5, color: "text.secondary", textAlign: "left", cursor: "pointer", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
        <Icon name="search" sx={{ fontSize: 20 }} />{ct("Search products, codes or lot numbers")}
      </Box>
      <Typography id="menu-products-title" component="h2" sx={{ fontSize: 23, letterSpacing: "-.03em", fontWeight: 500, mb: 1.5 }}>{act("products")}</Typography>
      {catalog.categories.length ? <CategoryPicker catalog={catalog} active={category} onPick={setCategory} direction="row" /> : null}
      <Box component="ul" aria-live="polite" sx={{ listStyle: "none", m: 0, mt: 1.5, p: 0, display: "grid", gap: .25 }}>
        {shown.map((product) => (
          <li key={product.id}>
            <Box component={LocalizedNextLink} href={`/products/${product.handle}`} onClick={onNavigate} sx={{ ...productLinkSx, mx: -1 }}>
              <MenuProductRow product={product} />
            </Box>
          </li>
        ))}
      </Box>
      <ButtonLink href={shopHref(category)} onClick={onNavigate} variant="contained" fullWidth endIcon={<Icon name="arrowRight" />} sx={{ mt: 2, minHeight: 48 }}>
        {ct.template("See all {v0} products", { v0: products.length })}
      </ButtonLink>
    </Box>
  )
}
