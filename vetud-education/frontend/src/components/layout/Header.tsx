"use client"

import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Dialog from "@mui/material/Dialog"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Suspense, useRef, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { motion } from "@/theme/tokens"
import { useAccount } from "../account/AccountProvider"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import { useLanguage } from "../common/language"
import { LocalizedNextLink } from "../common/links"
import LanguageSwitcher from "./LanguageSwitcher"
import { NAV_LABEL_KEYS, NAV_LINKS } from "./nav"
import SearchBox from "./SearchBox"

const navLinkSx = (active: boolean) => ({ fontSize: 13, fontWeight: 600, textDecoration: "none", color: active ? "brand.blue" : "brand.navySoft", py: 1.5, position: "relative", "&::after": { content: '""', position: "absolute", bottom: 6, left: 0, right: 0, height: 2, bgcolor: "brand.blue", transform: active ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: `transform .3s ${motion}` }, "&:hover::after": { transform: "scaleX(1)" } })

function MainNav({ activeHref }: { activeHref?: string }) {
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  return <Stack component="nav" aria-label={act("mainNav")} direction="row" spacing={3.5} sx={{ display: { xs: "none", lg: "flex" }, mx: "auto" }}>
    {NAV_LINKS.map((link) => <Box key={link.href} component={LocalizedNextLink} href={link.href} aria-current={link.href === activeHref ? "page" : undefined} sx={navLinkSx(link.href === activeHref)}>{t(NAV_LABEL_KEYS[link.href])}</Box>)}
  </Stack>
}

function ActiveMainNav() {
  const pathname = usePathname()
  const language = useLanguage()
  const active = NAV_LINKS.find((link) => pathname.startsWith(`/${language}${link.href}`))
  return <MainNav activeHref={active?.href} />
}

export default function Header() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  const { customer } = useAccount()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  const mobileLinkSx = { display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", py: 2.5, borderBottom: "1px solid rgba(23,53,75,.08)", fontSize: 23, letterSpacing: "-.03em", "&:hover": { color: "brand.blue" } }
  return <>
    <AppBar position="sticky" sx={{ top: 0, mt: 0, mx: "auto", width: "100%", borderRadius: 0, bgcolor: "rgba(255,255,255,.94)", backdropFilter: "blur(18px)", borderBottom: "1px solid", borderColor: "divider", boxShadow: "none" }}>
      <Toolbar sx={{ minHeight: { xs: 76, md: 92 }, width: "100%", maxWidth: 1488, mx: "auto", px: { xs: 1.5, sm: 2, md: 6 }, gap: { xs: 0, sm: .25, md: 1.5 }, "& > .MuiIconButton-root": { minWidth: 44, width: 44, height: 44 } }}>
        <Box component={LocalizedNextLink} href="/" aria-label={act("homeLink")} sx={{ textDecoration: "none", display: "inline-flex", mr: { xs: "auto", lg: 5 } }}><Logo /></Box>
        <Suspense fallback={<MainNav />}><ActiveMainNav /></Suspense>
        <Box sx={{ display: { xs: "none", md: "block" }, ml: { md: "auto", lg: 1 } }}><LanguageSwitcher /></Box>
        <IconButton component={LocalizedNextLink} href="/account" aria-label={ct(customer ? act("openAccount") : act("signInCreate"))} sx={{ display: { xs: "none", sm: "inline-flex" } }}>
          <Icon name="account" sx={{ fontSize: 22 }} />
        </IconButton>
        <IconButton aria-label={t("search")} onClick={() => setSearchOpen(true)}><Icon name="search" sx={{ fontSize: 22 }} /></IconButton>
        <IconButton aria-label={act("openMenu")} aria-expanded={menuOpen} aria-controls={menuOpen ? "mobile-navigation" : undefined} onClick={() => setMenuOpen(true)} sx={{ display: { xs: "inline-flex", lg: "none" } }}>
          <Box aria-hidden sx={{ position: "relative", width: 20, height: 18 }}><Box sx={{ position: "absolute", left: 0, right: 0, top: 5, height: 1.5, bgcolor: "currentColor", transition: `transform .4s ${motion}`, transform: menuOpen ? "translateY(3px) rotate(45deg)" : "none" }} /><Box sx={{ position: "absolute", left: 0, right: 0, top: 11, height: 1.5, bgcolor: "currentColor", transition: `transform .4s ${motion}`, transform: menuOpen ? "translateY(-3px) rotate(-45deg)" : "none" }} /></Box>
        </IconButton>
      </Toolbar>
    </AppBar>
    <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)} slotProps={{ paper: { sx: { width: { xs: "min(100vw, 420px)" }, borderRadius: 0, bgcolor: "#fbfcfe" } } }}>
      <Box id="mobile-navigation" component="nav" aria-label={act("mobileNav")} sx={{ p: 3.5, pt: 4, pb: "max(28px, env(safe-area-inset-bottom))" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 6 }}><Logo /><IconButton aria-label={act("closeMenu")} onClick={() => setMenuOpen(false)}><Icon name="close" /></IconButton></Stack>
        {NAV_LINKS.map((link, index) => <Box key={link.href} component={LocalizedNextLink} href={link.href} onClick={() => setMenuOpen(false)} sx={{ ...mobileLinkSx, animation: `vetud-enter .5s ${motion} ${index * .06}s both` }}>{t(NAV_LABEL_KEYS[link.href])}<Icon name="arrowUpRight" sx={{ fontSize: 20 }} /></Box>)}
        <Box component={LocalizedNextLink} href="/account" onClick={() => setMenuOpen(false)} sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 4, color: "brand.navy", textDecoration: "none", fontWeight: 700 }}>
          <Icon name="account" sx={{ fontSize: 20 }} />
          {ct(customer ? act("yourAccount") : act("signInCreate"))}
        </Box>
        <Box sx={{ mt: 2 }}><LanguageSwitcher /></Box>
        <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 3 }}>{ct("Peptide science. A clearer perspective.")}</Typography>
      </Box>
    </Drawer>
    <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth="sm" aria-labelledby="search-title" slotProps={{ paper: { sx: { alignSelf: "flex-start", mt: 10, p: { xs: 2.5, sm: 4 } } }, transition: { onEntered: () => searchInput.current?.focus() } }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}><Typography component="h2" variant="h4" id="search-title">{ct("Search the library")}</Typography><IconButton aria-label={act("closeSearch")} onClick={() => setSearchOpen(false)}><Icon name="close" /></IconButton></Stack>
      <SearchBox autoFocus inline inputRef={searchInput} onNavigate={() => setSearchOpen(false)} />
      <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 2 }}>{ct("Search peptide guides and news.")}</Typography>
    </Dialog>
  </>
}
