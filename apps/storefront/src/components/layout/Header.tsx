"use client"

import CloseIcon from "@mui/icons-material/Close"
import MenuIcon from "@mui/icons-material/Menu"
import SearchIcon from "@mui/icons-material/Search"
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined"
import AppBar from "@mui/material/AppBar"
import Badge from "@mui/material/Badge"
import Box from "@mui/material/Box"
import Dialog from "@mui/material/Dialog"
import Divider from "@mui/material/Divider"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import List from "@mui/material/List"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Stack from "@mui/material/Stack"
import Toolbar from "@mui/material/Toolbar"
import { usePathname } from "next/navigation"
import { Suspense, useState } from "react"
import { gutter } from "@/theme/tokens"
import Logo from "../brand/Logo"
import { LocalizedNextLink } from "../common/links"
import { useStore } from "../store/StoreProvider"
import CountrySelect from "./CountrySelect"
import { NAV_LINKS } from "./nav"
import SearchBox from "./SearchBox"

function MainNav({ activeHref }: { activeHref?: string }) {
  return (
    <Stack component="nav" aria-label="Main" direction="row" spacing={3.5} sx={{ display: { xs: "none", lg: "flex" }, ml: 2 }}>
      {NAV_LINKS.map((link) => {
        const active = link.href === activeHref
        return (
          <Box
            key={link.href}
            component={LocalizedNextLink}
            href={link.href}
            aria-current={active ? "page" : undefined}
            sx={{
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
              color: active ? "secondary.main" : "#3d5a66",
              py: 1,
              borderBottom: "2px solid",
              borderColor: active ? "secondary.main" : "transparent",
              "&:hover": { color: "secondary.main" },
            }}
          >
            {link.label}
          </Box>
        )
      })}
    </Stack>
  )
}

/** Reads the URL to highlight the current section; suspends only on app shells with unknown params. */
function ActiveMainNav() {
  const pathname = usePathname()
  const { countryCode } = useStore()
  const active = NAV_LINKS.find((link) => pathname.startsWith(`/${countryCode}${link.href}`))
  return <MainNav activeHref={active?.href} />
}

export default function Header() {
  const { itemCount, openDrawer } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          top: 0,
          bgcolor: "rgba(249,250,247,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 66, md: 78 }, px: gutter, gap: 2 }}>
          <Box
            component={LocalizedNextLink}
            href="/"
            aria-label="Vetud Peptides home"
            sx={{ textDecoration: "none", display: "inline-flex", mr: { md: 2 } }}
          >
            <Logo />
          </Box>

          <Suspense fallback={<MainNav />}>
            <ActiveMainNav />
          </Suspense>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: { xs: "none", md: "block" }, width: { md: 260, lg: 300 } }}>
            <SearchBox dense />
          </Box>
          <IconButton
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <SearchIcon />
          </IconButton>

          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <CountrySelect />
          </Box>

          <IconButton
            aria-label={`Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`}
            onClick={openDrawer}
            sx={{ border: "1px solid", borderColor: "divider", bgcolor: "#fff" }}
          >
            <Badge badgeContent={itemCount} color="secondary" max={99}>
              <ShoppingBagOutlinedIcon />
            </Badge>
          </IconButton>

          <IconButton
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            sx={{ display: { xs: "inline-flex", lg: "none" } }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <Box sx={{ width: 300, p: 2.5 }} role="navigation" aria-label="Mobile">
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Logo />
            <IconButton aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <List>
            {[{ label: "Home", href: "/" }, ...NAV_LINKS].map((link) => (
              <ListItemButton
                key={link.href}
                component={LocalizedNextLink}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText primary={link.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
          <CountrySelect fullWidth />
        </Box>
      </Drawer>

      <Dialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { alignSelf: "flex-start", mt: 8, p: 2 } } }}
      >
        <SearchBox autoFocus onNavigate={() => setSearchOpen(false)} />
      </Dialog>
    </>
  )
}
