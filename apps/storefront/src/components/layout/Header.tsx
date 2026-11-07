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
import { Suspense, useRef, useState } from "react"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import { LocalizedNextLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import CartAnnouncer from "../cart/CartAnnouncer"
import CountrySelect from "./CountrySelect"
import { NAV_LABEL_KEYS, NAV_LINKS, SECONDARY_LINKS } from "./nav"
import SearchBox from "./SearchBox"
import { motion } from "@/theme/tokens"
import { useAccount } from "../account/AccountProvider"

function MainNav({ activeHref }: { activeHref?: string }) {
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  return <Stack component="nav" aria-label={act("mainNav")} direction="row" spacing={3.5} sx={{ display: { xs: "none", lg: "flex" }, mx: "auto" }}>
    {NAV_LINKS.map((link) => <Box key={link.href} component={LocalizedNextLink} href={link.href} aria-current={link.href === activeHref ? "page" : undefined} sx={{ fontSize: 13, fontWeight: 600, textDecoration: "none", color: link.href === activeHref ? "brand.blue" : "brand.navySoft", py: 1.5, position: "relative", "&::after": { content: '""', position: "absolute", bottom: 6, left: 0, right: 0, height: 2, bgcolor: "brand.blue", transform: link.href === activeHref ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: `transform .3s ${motion}` }, "&:hover::after": { transform: "scaleX(1)" } }}>{t(NAV_LABEL_KEYS[link.href])}</Box>)}
  </Stack>
}
function ActiveMainNav() {
  const pathname = usePathname()
  const { countryCode } = useStore()
  const active = NAV_LINKS.find((link) => pathname.startsWith(`/${countryCode}${link.href}`))
  return <MainNav activeHref={active?.href} />
}

export default function Header() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  const { itemCount, openDrawer } = useStore()
  const { customer } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  return <>
    <AppBar position="sticky" sx={{ top: 0, mt: 0, mx: "auto", width: "100%", borderRadius: 0, bgcolor: "rgba(255,255,255,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid", borderColor: "divider", boxShadow: "none" }}>
      <Toolbar sx={{ minHeight: { xs: 76, md: 92 }, width: "100%", maxWidth: 1488, mx: "auto", px: { xs: 1.5, sm: 2, md: 6 }, gap: { xs: 0, sm: .25, md: 1.5 }, "& > .MuiIconButton-root": { minWidth: 44, width: 44, height: 44 } }}>
        <Box component={LocalizedNextLink} href="/" aria-label={act("homeLink")} sx={{ textDecoration: "none", display: "inline-flex", mr: { xs: "auto", lg: 5 } }}><Logo /></Box>
        <Suspense fallback={<MainNav />}><ActiveMainNav /></Suspense>
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
        <IconButton aria-label={t("search")} onClick={() => setSearchOpen(true)}><Icon name="search" sx={{ fontSize: 22 }} /></IconButton>
        <IconButton aria-label={act("openCart", { count: itemCount })} onClick={openDrawer} sx={{ bgcolor: "#edf3f6" }}><Badge badgeContent={itemCount} color="primary" max={99}><Icon name="bag" sx={{ fontSize: 22 }} /></Badge></IconButton>
        <CartAnnouncer />
        <IconButton aria-label={act("openMenu")} aria-expanded={menuOpen} aria-controls={menuOpen ? "mobile-navigation" : undefined} onClick={() => setMenuOpen(true)} sx={{ display: { xs: "inline-flex", lg: "none" } }}>
          <Box aria-hidden sx={{ position: "relative", width: 20, height: 18 }}><Box sx={{ position: "absolute", left: 0, right: 0, top: 5, height: 1.5, bgcolor: "currentColor", transition: `transform .4s ${motion}`, transform: menuOpen ? "translateY(3px) rotate(45deg)" : "none" }} /><Box sx={{ position: "absolute", left: 0, right: 0, top: 11, height: 1.5, bgcolor: "currentColor", transition: `transform .4s ${motion}`, transform: menuOpen ? "translateY(-3px) rotate(-45deg)" : "none" }} /></Box>
        </IconButton>
      </Toolbar>
    </AppBar>
    <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{ paper: { sx: { width: { xs: "min(100vw, 420px)" }, borderRadius: 0, bgcolor: "#fbfcfe" } } }}>
      <Box id="mobile-navigation" component="nav" aria-label={act("mobileNav")} sx={{ p: 3.5, pt: 4, pb: "max(28px, env(safe-area-inset-bottom))" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 6 }}><Logo /><IconButton aria-label={act("closeMenu")} onClick={() => setMenuOpen(false)}><Icon name="close" /></IconButton></Stack>
        {NAV_LINKS.map((link, index) => <Box key={link.href} component={LocalizedNextLink} href={link.href} onClick={() => setMenuOpen(false)} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", py: 2.5, borderBottom: "1px solid rgba(23,53,75,.08)", fontSize: 23, letterSpacing: "-.03em", animation: `vetud-enter .5s ${motion} ${index * .06}s both`, "&:hover": { color: "brand.blue" } }}>{t(NAV_LABEL_KEYS[link.href])}<Icon name="arrowUpRight" sx={{ fontSize: 20 }} /></Box>)}
        <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
          {SECONDARY_LINKS.map((link) => <Box key={link.href} component={LocalizedNextLink} href={link.href} onClick={() => setMenuOpen(false)} sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 13, color: "text.secondary", textDecoration: "none", "&:hover": { color: "brand.blue" } }}>{t(NAV_LABEL_KEYS[link.href])}</Box>)}
        </Stack>
        <Box
          component={LocalizedNextLink}
          href="/account"
          onClick={() => setMenuOpen(false)}
          sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 4, color: "brand.navy", textDecoration: "none", fontWeight: 700 }}
        >
          <Icon name="account" sx={{ fontSize: 20 }} />
          {ct(customer ? act("yourAccount") : act("signInCreate"))}
        </Box>
        <Box component={LocalizedNextLink} href="/account/orders" onClick={() => setMenuOpen(false)} sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2.5, minHeight: 44, color: "brand.navy", textDecoration: "none", fontWeight: 700 }}>
          <Icon name="package" sx={{ fontSize: 20 }} />{act("ordersTracking")}
        </Box>
        <Box sx={{ mt: 3 }}><CountrySelect fullWidth /></Box>
        <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 3 }}>{ct("Peptide science. A clearer perspective.")}</Typography>
      </Box>
    </Drawer>
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="sm" aria-labelledby="search-title" slotProps={{ paper: { sx: { alignSelf: "flex-start", mt: 10, p: { xs: 2.5, sm: 4 } } }, transition: { onEntered: () => searchInput.current?.focus() } }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}><Typography component="h2" variant="h4" id="search-title">{ct("Find your research materials")}</Typography><IconButton aria-label={act("closeSearch")} onClick={() => setSearchOpen(false)}><Icon name="close" /></IconButton></Stack>
      <SearchBox autoFocus inputRef={searchInput} onNavigate={() => setSearchOpen(false)} />
      <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 2 }}>{ct("Search products (name, code or lot number), peptide guides and news.")}</Typography>
    </Dialog>
  </>
}
