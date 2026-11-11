"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import AppBar from "@mui/material/AppBar"
import { useTranslations } from "next-intl"
import Badge from "@mui/material/Badge"
import Box from "@mui/material/Box"
import Dialog from "@mui/material/Dialog"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import { usePathname } from "next/navigation"
import { Suspense, useEffect, useRef, useState, type RefObject } from "react"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import { LocalizedNextLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import CartAnnouncer from "../cart/CartAnnouncer"
import CountrySelect from "./CountrySelect"
import { EDUCATION_LINKS, HEADER_LINKS, NAV_LABEL_KEYS, SECONDARY_LINKS } from "./nav"
import { ProductMegaMenu, ProductMenuSection } from "./ProductMenu"
import SearchBox from "./SearchBox"
import type { ProductMenuData } from "@/lib/product-menu"
import { motion } from "@/theme/tokens"
import { useAccount } from "../account/AccountProvider"

const PRODUCT_MENU_ID = "product-menu"
const LEARN_LINK = EDUCATION_LINKS[0]
/** Pages that belong to the "Products" menu item. */
const PRODUCT_PATHS = ["/shop", "/products", "/dual-chamber-pen"]

const navLinkSx = (active: boolean) => ({ display: "inline-flex", alignItems: "center", gap: .5, fontSize: 13, fontWeight: 600, textDecoration: "none", color: active ? "brand.blue" : "brand.navySoft", py: 1.5, position: "relative", "&::after": { content: '""', position: "absolute", bottom: 6, left: 0, right: 0, height: 2, bgcolor: "brand.blue", transform: active ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: `transform .3s ${motion}` }, "&:hover::after": { transform: "scaleX(1)" } })

type ProductTrigger = {
  open: boolean
  onToggle: () => void
  onHover: (entering: boolean) => void
}

type MainNavProps = { active?: string; products: ProductTrigger; triggerRef: RefObject<HTMLButtonElement | null> }

function MainNav({ active, products, triggerRef }: MainNavProps) {
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  return <Stack component="nav" aria-label={act("mainNav")} direction="row" spacing={3.5} sx={{ display: { xs: "none", lg: "flex" }, mx: "auto", alignItems: "center" }}>
    <Box
      ref={triggerRef}
      component="button"
      type="button"
      aria-expanded={products.open}
      aria-controls={PRODUCT_MENU_ID}
      onClick={products.onToggle}
      onPointerEnter={(event) => event.pointerType === "mouse" && products.onHover(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && products.onHover(false)}
      sx={{ ...navLinkSx(active === "/shop" || products.open), border: 0, bgcolor: "transparent", font: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 4, borderRadius: "2px" } }}
    >
      {act("products")}
      <Icon name="chevronDown" sx={{ fontSize: 16, transition: `transform .25s ${motion}`, transform: products.open ? "rotate(180deg)" : "none" }} />
    </Box>
    {HEADER_LINKS.map((link) => <Box key={link.href} component={LocalizedNextLink} href={link.href} aria-current={link.href === active ? "page" : undefined} sx={navLinkSx(link.href === active)}>{t(NAV_LABEL_KEYS[link.href])}</Box>)}
    <Box component="a" href={LEARN_LINK.href} sx={navLinkSx(false)}>{t(LEARN_LINK.key)}<Icon name="arrowUpRight" sx={{ fontSize: 14 }} /></Box>
  </Stack>
}
function ActiveMainNav({ products, triggerRef }: Omit<MainNavProps, "active">) {
  const pathname = usePathname()
  const { countryCode } = useStore()
  const under = (path: string) => pathname.startsWith(`/${countryCode}${path}`)
  const active = PRODUCT_PATHS.some(under) ? "/shop" : HEADER_LINKS.find((link) => under(link.href))?.href
  return <MainNav active={active} products={products} triggerRef={triggerRef} />
}

/**
 * The site header. On desktop, "Products" opens a panel with the catalog by category (on hover with a
 * mouse, or on click and keyboard). On phones the menu leads with the same products.
 */
export default function Header({ catalog }: { catalog: ProductMenuData }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  const { itemCount, openDrawer } = useStore()
  const { customer } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const header = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const openTimer = useRef<number | undefined>(undefined)
  const closeTimer = useRef<number | undefined>(undefined)
  // A menu opened by hovering closes when the mouse leaves; one opened by click stays until dismissed.
  const openedByHover = useRef(false)

  const clearTimers = () => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(closeTimer.current)
  }
  const closeProducts = () => {
    clearTimers()
    setProductsOpen(false)
  }

  useEffect(() => {
    if (!productsOpen) return
    const close = () => {
      window.clearTimeout(closeTimer.current)
      setProductsOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      close()
      trigger.current?.focus()
    }
    const onPointer = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) close()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [productsOpen])

  useEffect(() => () => {
    window.clearTimeout(openTimer.current)
    window.clearTimeout(closeTimer.current)
  }, [])

  const products: ProductTrigger = {
    open: productsOpen,
    onToggle: () => {
      clearTimers()
      // A click on a menu that hovering just opened keeps it open (now until dismissed).
      const keepOpen = productsOpen && openedByHover.current
      openedByHover.current = false
      setProductsOpen(keepOpen || !productsOpen)
    },
    onHover: (entering) => {
      window.clearTimeout(openTimer.current)
      if (entering && !productsOpen) {
        openTimer.current = window.setTimeout(() => {
          openedByHover.current = true
          setProductsOpen(true)
        }, 120)
      }
    },
  }

  const openSearch = () => {
    setMenuOpen(false)
    closeProducts()
    setSearchOpen(true)
  }

  return <>
    <AppBar
      ref={header}
      position="sticky"
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return
        clearTimers()
        if (productsOpen && openedByHover.current) closeTimer.current = window.setTimeout(() => setProductsOpen(false), 220)
      }}
      onPointerEnter={() => window.clearTimeout(closeTimer.current)}
      sx={{ top: 0, mt: 0, mx: "auto", width: "100%", borderRadius: 0, bgcolor: "rgba(255,255,255,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid", borderColor: "divider", boxShadow: "none" }}
    >
      <Toolbar sx={{ minHeight: { xs: 76, md: 92 }, width: "100%", maxWidth: 1488, mx: "auto", px: { xs: 1.5, sm: 2, md: 6 }, gap: { xs: 0, sm: .25, md: 1.5 }, "& > .MuiIconButton-root": { minWidth: 44, width: 44, height: 44 } }}>
        <Box component={LocalizedNextLink} href="/" aria-label={act("homeLink")} sx={{ textDecoration: "none", display: "inline-flex", mr: { xs: "auto", lg: 5 } }}><Logo /></Box>
        <Suspense fallback={<MainNav products={products} triggerRef={trigger} />}><ActiveMainNav products={products} triggerRef={trigger} /></Suspense>
        <Box sx={{ display: { xs: "none", md: "block" }, ml: { md: "auto", lg: 1 } }}><CountrySelect /></Box>
        <IconButton
          component={LocalizedNextLink}
          href="/account"
          aria-label={ct(customer ? act("openAccount") : act("signInCreate"))}
          sx={{ display: { xs: "none", sm: "inline-flex" } }}
        >
          <Icon name="account" sx={{ fontSize: 22 }} />
        </IconButton>
        {customer ? <IconButton component={LocalizedNextLink} href="/account/orders" aria-label={act("ordersTracking")} sx={{ display: { xs: "none", sm: "inline-flex" } }}><Icon name="package" sx={{ fontSize: 22 }} /></IconButton> : null}
        <IconButton aria-label={t("search")} onClick={openSearch}><Icon name="search" sx={{ fontSize: 22 }} /></IconButton>
        <IconButton aria-label={act("openCart", { count: itemCount })} onClick={openDrawer} sx={{ bgcolor: "#edf3f6" }}><Badge badgeContent={itemCount} color="primary" max={99}><Icon name="bag" sx={{ fontSize: 22 }} /></Badge></IconButton>
        <CartAnnouncer />
        <IconButton aria-label={act("openMenu")} aria-expanded={menuOpen} aria-controls={menuOpen ? "mobile-navigation" : undefined} onClick={() => setMenuOpen(true)} sx={{ display: { xs: "inline-flex", lg: "none" } }}>
          <Box aria-hidden sx={{ position: "relative", width: 20, height: 18 }}><Box sx={{ position: "absolute", left: 0, right: 0, top: 5, height: 1.5, bgcolor: "currentColor", transition: `transform .4s ${motion}`, transform: menuOpen ? "translateY(3px) rotate(45deg)" : "none" }} /><Box sx={{ position: "absolute", left: 0, right: 0, top: 11, height: 1.5, bgcolor: "currentColor", transition: `transform .4s ${motion}`, transform: menuOpen ? "translateY(-3px) rotate(-45deg)" : "none" }} /></Box>
        </IconButton>
      </Toolbar>
      {productsOpen ? <Box sx={{ display: { xs: "none", lg: "block" } }}><ProductMegaMenu id={PRODUCT_MENU_ID} catalog={catalog} onNavigate={closeProducts} /></Box> : null}
    </AppBar>
    <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{ paper: { sx: { width: { xs: "min(100vw, 420px)" }, borderRadius: 0, bgcolor: "#fbfcfe" } } }}>
      <Box id="mobile-navigation" component="nav" aria-label={act("mobileNav")} sx={{ p: 3.5, pt: 4, pb: "max(28px, env(safe-area-inset-bottom))" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}><Logo /><IconButton aria-label={act("closeMenu")} onClick={() => setMenuOpen(false)}><Icon name="close" /></IconButton></Stack>
        <ProductMenuSection catalog={catalog} onNavigate={() => setMenuOpen(false)} onSearch={openSearch} />
        <Box sx={{ mt: 4, pt: 2, borderTop: "1px solid", borderColor: "divider", display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 2 }}>
          {SECONDARY_LINKS.map((link) => <Box key={link.href} component={LocalizedNextLink} href={link.href} onClick={() => setMenuOpen(false)} sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, color: "text.secondary", textDecoration: "none", "&:hover": { color: "brand.blue" } }}>{t(NAV_LABEL_KEYS[link.href])}</Box>)}
          <Box component="a" href={LEARN_LINK.href} sx={{ display: "inline-flex", alignItems: "center", gap: .5, minHeight: 44, fontSize: 14, color: "text.secondary", textDecoration: "none", "&:hover": { color: "brand.blue" } }}>{t(LEARN_LINK.key)}<Icon name="arrowUpRight" sx={{ fontSize: 15 }} /></Box>
        </Box>
        <Box
          component={LocalizedNextLink}
          href="/account"
          onClick={() => setMenuOpen(false)}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 3, minHeight: 44, color: "brand.navy", textDecoration: "none", fontWeight: 700 }}
        >
          <Icon name="account" sx={{ fontSize: 20 }} />
          {ct(customer ? act("yourAccount") : act("signInCreate"))}
        </Box>
        <Box component={LocalizedNextLink} href="/account/orders" onClick={() => setMenuOpen(false)} sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, minHeight: 44, color: "brand.navy", textDecoration: "none", fontWeight: 700 }}>
          <Icon name="package" sx={{ fontSize: 20 }} />{act("ordersTracking")}
        </Box>
        <Box sx={{ mt: 3 }}><CountrySelect fullWidth /></Box>
      </Box>
    </Drawer>
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="sm" aria-labelledby="search-title" slotProps={{ paper: { sx: { alignSelf: "flex-start", mt: { xs: 2, sm: 10 }, mx: { xs: 1.5, sm: 4 }, width: { xs: "calc(100% - 24px)", sm: undefined }, p: { xs: 2.5, sm: 4 } } }, transition: { onEntered: () => searchInput.current?.focus() } }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}><Typography component="h2" variant="h4" id="search-title">{ct("Search products")}</Typography><IconButton aria-label={act("closeSearch")} onClick={() => setSearchOpen(false)}><Icon name="close" /></IconButton></Stack>
      <SearchBox autoFocus inline inputRef={searchInput} catalog={catalog} onNavigate={() => setSearchOpen(false)} />
    </Dialog>
  </>
}
