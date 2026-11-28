"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Drawer from "@mui/material/Drawer"
import IconButton from "@mui/material/IconButton"
import type { Theme } from "@mui/material/styles"
import useMediaQuery from "@mui/material/useMediaQuery"
import Image from "next/image"
import { useSelectedLayoutSegments } from "next/navigation"
import { useTranslations } from "next-intl"
import { Suspense, useState } from "react"
import { brand } from "@/theme/tokens"
import { useAccount } from "../account/AccountProvider"
import { BOOK } from "../book/book"
import Icon from "../brand/Icon"
import { LogoMark } from "../brand/Logo"
import { LocalizedNextLink } from "../common/links"
import LanguageSwitcher from "./LanguageSwitcher"
import { currentNavLocation, NAV_LINKS } from "./nav"

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  minHeight: 52,
  px: 1.5,
  py: 0.75,
  color: "brand.ink",
  borderRadius: "10px",
  textDecoration: "none",
  fontWeight: 600,
  "&:hover": { bgcolor: "brand.mintWash" },
  "&[aria-current]": { bgcolor: "brand.mintLight", color: "brand.navy", boxShadow: `inset 3px 0 ${brand.blue}` },
}

function MenuButton({ open = false, onOpen }: { open?: boolean; onOpen?: () => void }) {
  const t = useTranslations("Common")
  const act = useTranslations("Actions")
  return (
    <Button
      aria-label={act("openMenu")}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={open ? "mobile-menu" : undefined}
      disabled={!onOpen}
      onClick={onOpen}
      startIcon={<Icon name="menu" />}
      sx={{
        display: { xs: "inline-flex", lg: "none" },
        minWidth: 0,
        minHeight: 44,
        px: 1.25,
        ml: 0.25,
        borderRadius: "10px",
        bgcolor: "brand.mintLight",
        color: "brand.navy",
        fontWeight: 700,
        "& .MuiButton-startIcon": { ml: 0, mr: 0.75 },
        "&:hover": { bgcolor: "brand.mint", transform: "none" },
      }}
    >
      {t("menu")}
    </Button>
  )
}

function Menu({ segments }: { segments: string[] }) {
  const t = useTranslations("Common")
  const act = useTranslations("Actions")
  const { customer } = useAccount()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const links = [
    { href: "/", label: act("home"), icon: "home" as const },
    ...NAV_LINKS.map((link) => ({ ...link, label: t(link.label) })),
  ]

  return (
    <>
      <MenuButton open={open} onOpen={() => setOpen(true)} />

      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{
          paper: {
            id: "mobile-menu",
            "aria-labelledby": "mobile-menu-title",
            sx: {
              width: "min(390px, calc(100% - 16px))",
              maxHeight: "100dvh",
              borderRadius: 0,
              bgcolor: "background.paper",
              overflow: "hidden",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexShrink: 0,
            px: 2.5,
            pb: 1.5,
            pt: "max(12px, env(safe-area-inset-top))",
            bgcolor: "brand.navyDeep",
            color: "brand.onNavy",
          }}
        >
          <LogoMark tone="light" size={30} />
          <Box
            component="h2"
            id="mobile-menu-title"
            sx={{ m: 0, fontSize: 23, fontWeight: 600, letterSpacing: "-.025em" }}
          >
            {t("menu")}
          </Box>
          <IconButton
            autoFocus
            aria-label={act("closeMenu")}
            onClick={close}
            sx={{
              ml: "auto",
              color: "inherit",
              bgcolor: brand.whiteA07,
              "&:hover": { bgcolor: brand.whiteA16 },
              "&.Mui-focusVisible": { outlineColor: brand.cyan },
            }}
          >
            <Icon name="close" />
          </IconButton>
        </Box>
        <Box
          component="nav"
          aria-label={act("mobileNav")}
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            overflowY: "auto",
            overscrollBehavior: "contain",
            px: 2,
            pt: 2,
            pb: "max(20px, env(safe-area-inset-bottom))",
          }}
        >
          <Box component="ul" sx={{ display: "grid", gap: 0.5, listStyle: "none", p: 0, m: 0 }}>
            {links.map((link) => {
              const book = link.href === "/book"
              return (
                <li key={link.href}>
                  <Box
                    component={LocalizedNextLink}
                    href={link.href}
                    onClick={close}
                    aria-current={currentNavLocation(segments, link.href)}
                    sx={{
                      ...rowSx,
                      fontSize: 17,
                      ...(book && { py: 1, bgcolor: "brand.slate50", "&:hover": { bgcolor: "brand.mint" } }),
                    }}
                  >
                    <Box
                      component="span"
                      sx={{ width: 34, display: "grid", placeItems: "center", flexShrink: 0, color: "brand.teal" }}
                    >
                      {book ? (
                        <Image src={BOOK.cover} alt="" width={33} height={44} />
                      ) : (
                        <Icon name={link.icon} sx={{ fontSize: 22 }} />
                      )}
                    </Box>
                    <Box component="span" sx={{ flex: 1, lineHeight: 1.4 }}>
                      {link.label}
                      {book && (
                        <Box
                          component="span"
                          sx={{ display: "block", color: "brand.slate625", fontSize: 13, fontWeight: 500 }}
                        >
                          {BOOK.title}
                        </Box>
                      )}
                    </Box>
                    <Icon
                      name="chevronDown"
                      sx={{ fontSize: 16, transform: "rotate(-90deg)", color: "brand.slate625" }}
                    />
                  </Box>
                </li>
              )
            })}
          </Box>
          <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: "brand.line" }}>
            <Box
              component={LocalizedNextLink}
              href="/account"
              onClick={close}
              aria-current={currentNavLocation(segments, "/account")}
              sx={{ ...rowSx, fontSize: 15 }}
            >
              <Icon name="account" sx={{ width: 34, fontSize: 21, color: "brand.teal" }} />
              {customer ? act("yourAccount") : act("signInCreate")}
            </Box>
            <LanguageSwitcher />
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

function CurrentMenu() {
  const segments = useSelectedLayoutSegments()
  const mobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("lg"))
  // A fresh drawer for each destination. The static button reserves its place until hydration.
  return mobile ? <Menu key={segments.join("/")} segments={segments} /> : <MenuButton />
}

export default function MobileMenu() {
  return (
    <Suspense fallback={<MenuButton />}>
      <CurrentMenu />
    </Suspense>
  )
}
