"use client"

import Icon from "@/components/brand/Icon"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import ListSubheader from "@mui/material/ListSubheader"
import Menu from "@mui/material/Menu"
import MenuItem from "@mui/material/MenuItem"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { persistCountryCookie } from "@/lib/country-cookie"
import { useStore } from "../store/StoreProvider"

const CURRENCIES = [
  { code: "usd", name: "US dollar", place: "United States" },
  { code: "eur", name: "Euro", place: "Germany, France, Netherlands" },
  { code: "gbp", name: "British pound", place: "United Kingdom" },
]

/** A compact currency list; destinations sharing EUR are selected in a second step. */
export default function CountrySelect({ fullWidth }: { fullWidth?: boolean }) {
  const router = useRouter()
  const { countryCode, countries, region } = useStore()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [destinationCurrency, setDestinationCurrency] = useState<string | null>(null)
  const options = CURRENCIES.map((currency) => ({ ...currency, countries: countries.filter((country) => country.currencyCode === currency.code) })).filter((currency) => currency.countries.length)
  const destination = options.find((currency) => currency.code === destinationCurrency)
  const close = () => { setAnchor(null); setDestinationCurrency(null) }

  const select = (code: string) => {
    close()
    persistCountryCookie(code)
    if (code === countryCode) return
    const { pathname, search, hash } = window.location
    const rest = pathname.split("/").slice(2).join("/")
    router.push(`/${code}${rest ? `/${rest}` : ""}${search}${hash}`)
  }

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<Icon name="globe" fontSize="small" />}
        endIcon={<Icon name="chevronDown" sx={{ fontSize: 13 }} />}
        onClick={(event) => { setDestinationCurrency(null); setAnchor(event.currentTarget) }}
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? "currency-menu" : undefined}
        aria-label={`Currency ${region.currencyCode.toUpperCase()}. Change currency and destination`}
        fullWidth={fullWidth}
        sx={{
          minHeight: 44,
          letterSpacing: "0.08em",
          fontWeight: 600,
          justifyContent: fullWidth ? "flex-start" : "center",
          "&:hover": { transform: "none" },
        }}
      >
        {region.currencyCode.toUpperCase()}
      </Button>
      <Menu
        key={destinationCurrency ?? "currencies"}
        id="currency-menu"
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { maxHeight: "min(500px, calc(100dvh - 140px))", width: 300, maxWidth: "calc(100vw - 32px)", borderRadius: 2.5, overscrollBehavior: "contain" } },
          list: { dense: true, "aria-label": destination ? `${destination.place} destinations in ${destination.code.toUpperCase()}` : "Choose currency", sx: { py: 0.75 } },
        }}
      >
        {destination ? [
          <MenuItem key="back" onClick={() => setDestinationCurrency(null)} sx={{ minHeight: 44, gap: 1.5, fontSize: 12, color: "text.secondary", borderBottom: "1px solid", borderColor: "divider", mb: 0.5 }}><Icon name="arrowRight" sx={{ fontSize: 16, transform: "rotate(180deg)" }} />Back to currencies</MenuItem>,
          <ListSubheader key="heading" sx={{ lineHeight: "36px", fontSize: 11, color: "text.secondary", bgcolor: "background.paper" }}>Choose a country · {destination.code.toUpperCase()}</ListSubheader>,
          ...destination.countries.map((country) => <MenuItem key={country.code} selected={country.code === countryCode} onClick={() => select(country.code)} sx={{ minHeight: 44, gap: 2, fontSize: 13 }}><Box component="span" sx={{ flex: 1 }}>{country.name}</Box>{country.code === countryCode && <Icon name="check" sx={{ fontSize: 16 }} />}</MenuItem>),
        ] : [
          <ListSubheader key="heading" sx={{ lineHeight: "36px", fontSize: 11, color: "text.secondary", bgcolor: "background.paper" }}>Choose your currency</ListSubheader>,
          ...options.map((currency) => <MenuItem key={currency.code} selected={currency.code === region.currencyCode} onClick={() => currency.countries.length > 1 ? setDestinationCurrency(currency.code) : select(currency.countries[0].code)} sx={{ minHeight: 48, gap: 2 }}><Typography component="span" variant="mono" sx={{ width: 36, fontSize: 12, fontWeight: 600 }}>{currency.code.toUpperCase()}</Typography><Box sx={{ flex: 1 }}><Typography sx={{ fontSize: 13 }}>{currency.name}</Typography><Typography sx={{ fontSize: 10.5, color: "text.secondary", mt: 0.1 }}>{currency.place}</Typography></Box><Icon name={currency.countries.length > 1 ? "arrowRight" : currency.code === region.currencyCode ? "check" : "arrowUpRight"} sx={{ fontSize: 15, color: "text.secondary" }} /></MenuItem>),
        ]}
      </Menu>
    </>
  )
}
