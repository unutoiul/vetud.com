"use client"

import { GlobeIcon as PublicIcon } from "@/components/brand/Icon"
import Button from "@mui/material/Button"
import ListSubheader from "@mui/material/ListSubheader"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useStore } from "../store/StoreProvider"

/** Switches the country segment of the current URL, which also switches region and currency. */
export default function CountrySelect({ fullWidth }: { fullWidth?: boolean }) {
  const router = useRouter()
  const { countryCode, countries, region } = useStore()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const currencies = Array.from(new Set(countries.map((country) => country.currencyCode)))

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
        slotProps={{ paper: { sx: { maxHeight: 420, minWidth: 240, borderRadius: 2.5, overscrollBehavior: "contain" } } }}
      >
        {currencies.flatMap((currency) => [
          <ListSubheader key={`h-${currency}`} sx={{ lineHeight: "36px", fontSize: 11, letterSpacing: "0.12em" }}>
            {currency.toUpperCase()}
          </ListSubheader>,
          ...countries
            .filter((country) => country.currencyCode === currency)
            .map((country) => (
              <MenuItem
                key={country.code}
                selected={country.code === countryCode}
                onClick={() => select(country.code)}
              >
                {country.name}
              </MenuItem>
            )),
        ])}
      </Menu>
    </>
  )
}
