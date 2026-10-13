"use client"

import { GlobeIcon as PublicIcon } from "@/components/brand/Icon"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useStore } from "../store/StoreProvider"

/** Switches the country segment of the current URL, which also switches region and currency. */
export default function CountrySelect({ fullWidth }: { fullWidth?: boolean }) {
  const router = useRouter()
  const { countryCode, countries, region } = useStore()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const select = (code: string) => {
    setAnchor(null)
    if (code === countryCode) return
    const { pathname, search } = window.location
    const rest = pathname.split("/").slice(2).join("/")
    router.push(`/${code}${rest ? `/${rest}` : ""}${search}`)
  }

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<PublicIcon fontSize="small" />}
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? "country-menu" : undefined}
        aria-label={`Shipping country: ${countryCode.toUpperCase()}, currency ${region.currencyCode.toUpperCase()}. Change`}
        fullWidth={fullWidth}
        sx={{
          letterSpacing: "0.08em",
          fontWeight: 600,
          justifyContent: fullWidth ? "flex-start" : "center",
          "&:hover": { transform: "none" },
        }}
      >
        {countryCode.toUpperCase()} · {region.currencyCode.toUpperCase()}
      </Button>
      <Menu
        id="country-menu"
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { maxHeight: 320, width: 260, maxWidth: "calc(100vw - 32px)", borderRadius: 2.5, overscrollBehavior: "contain" } },
          list: { dense: true, "aria-label": "Shipping country", sx: { py: 0.5 } },
        }}
      >
        {countries.map((country) => (
          <MenuItem
            key={country.code}
            selected={country.code === countryCode}
            onClick={() => select(country.code)}
            sx={{ minHeight: 40, gap: 2, fontSize: 13 }}
          >
            <Box component="span" sx={{ flex: 1 }}>{country.name}</Box>
            <Typography component="span" sx={{ color: "text.secondary", fontSize: 11 }}>
              {country.currencyCode.toUpperCase()}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
