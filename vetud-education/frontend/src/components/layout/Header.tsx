"use client"

import AppBar from "@mui/material/AppBar"
import Box from "@mui/material/Box"
import Dialog from "@mui/material/Dialog"
import IconButton from "@mui/material/IconButton"
import Stack from "@mui/material/Stack"
import Toolbar from "@mui/material/Toolbar"
import Typography from "@mui/material/Typography"
import { useSelectedLayoutSegments } from "next/navigation"
import { useTranslations } from "next-intl"
import { Suspense, useRef, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { brand, motion } from "@/theme/tokens"
import { useAccount } from "../account/AccountProvider"
import Icon from "../brand/Icon"
import Logo from "../brand/Logo"
import { LocalizedNextLink } from "../common/links"
import LanguageSwitcher from "./LanguageSwitcher"
import MobileMenu from "./MobileMenu"
import { currentNavLocation, NAV_LINKS } from "./nav"
import SearchBox from "./SearchBox"

const navLinkSx = (active: boolean) => ({
  fontSize: 13,
  fontWeight: 600,
  textDecoration: "none",
  color: active ? "brand.blue" : "brand.navySoft",
  py: 1.5,
  position: "relative",
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    height: 2,
    bgcolor: "brand.blue",
    transform: active ? "scaleX(1)" : "scaleX(0)",
    transformOrigin: "left",
    transition: `transform .3s ${motion}`,
  },
  "&:hover::after": { transform: "scaleX(1)" },
})

function MainNav({ segments = [] }: { segments?: string[] }) {
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  return (
    <Stack
      component="nav"
      aria-label={act("mainNav")}
      direction="row"
      spacing={3.5}
      sx={{ display: { xs: "none", lg: "flex" }, mx: "auto" }}
    >
      {NAV_LINKS.map((link) => {
        const current = currentNavLocation(segments, link.href)
        return (
          <Box
            key={link.href}
            component={LocalizedNextLink}
            href={link.href}
            aria-current={current}
            sx={navLinkSx(!!current)}
          >
            {t(link.label)}
          </Box>
        )
      })}
    </Stack>
  )
}

function ActiveMainNav() {
  return <MainNav segments={useSelectedLayoutSegments()} />
}

export default function Header() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  const { customer } = useAccount()
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInput = useRef<HTMLInputElement>(null)
  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          top: 0,
          mt: 0,
          mx: "auto",
          width: "100%",
          borderRadius: 0,
          bgcolor: brand.whiteA94,
          backdropFilter: "blur(18px)",
          borderBottom: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 76, md: 92 },
            width: "100%",
            maxWidth: 1488,
            mx: "auto",
            px: { xs: 1.5, sm: 2, md: 6 },
            gap: { xs: 0, sm: 0.25, md: 1.5 },
            "& > .MuiIconButton-root": { minWidth: 44, width: 44, height: 44 },
          }}
        >
          <Box
            component={LocalizedNextLink}
            href="/"
            aria-label={act("homeLink")}
            sx={{ textDecoration: "none", display: "inline-flex", mr: { xs: "auto", lg: 5 } }}
          >
            <Logo />
          </Box>
          <Suspense fallback={<MainNav />}>
            <ActiveMainNav />
          </Suspense>
          <Box sx={{ display: { xs: "none", md: "block" }, ml: { md: "auto", lg: 1 } }}>
            <LanguageSwitcher />
          </Box>
          <IconButton
            component={LocalizedNextLink}
            href="/account"
            aria-label={ct(customer ? act("openAccount") : act("signInCreate"))}
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
          >
            <Icon name="account" sx={{ fontSize: 22 }} />
          </IconButton>
          <IconButton aria-label={t("search")} onClick={() => setSearchOpen(true)}>
            <Icon name="search" sx={{ fontSize: 22 }} />
          </IconButton>
          <MobileMenu />
        </Toolbar>
      </AppBar>
      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="search-title"
        slotProps={{
          paper: { sx: { alignSelf: "flex-start", mt: 10, p: { xs: 2.5, sm: 4 } } },
          transition: { onEntered: () => searchInput.current?.focus() },
        }}
      >
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography component="h2" variant="h4" id="search-title">
            {ct("Search the library")}
          </Typography>
          <IconButton aria-label={act("closeSearch")} onClick={() => setSearchOpen(false)}>
            <Icon name="close" />
          </IconButton>
        </Stack>
        <SearchBox autoFocus inline inputRef={searchInput} onNavigate={() => setSearchOpen(false)} />
        <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 2 }}>
          {ct("Search peptide guides and news.")}
        </Typography>
      </Dialog>
    </>
  )
}
