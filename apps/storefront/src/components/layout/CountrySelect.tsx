"use client"

import Icon from "@/components/brand/Icon"
import Button from "@mui/material/Button"
import MenuItem from "@mui/material/MenuItem"
import Popover from "@mui/material/Popover"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { persistCountryCookie } from "@/lib/country-cookie"
import { useStore } from "../store/StoreProvider"

const CURRENCY_NAMES: Record<string, string> = {
  usd: "US dollar",
  eur: "Euro",
  gbp: "British pound",
}

/**
 * Two dropdowns: the currency, and the country. Prices, shipping and tax are set per region and a
 * country belongs to exactly one region, so each currency only offers the countries that use it
 * (Euro lists Germany, France and the Netherlands, not the UK). Changing the currency moves the
 * country to one that uses it; Apply opens the site for that country.
 */
export default function CountrySelect({ fullWidth }: { fullWidth?: boolean }) {
  const router = useRouter()
  const { countryCode, countries, region } = useStore()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [currency, setCurrency] = useState(region.currencyCode)
  const [country, setCountry] = useState(countryCode)

  // Only currencies that have at least one country we sell to.
  const currencies = Object.keys(CURRENCY_NAMES).filter((code) => countries.some((item) => item.currencyCode === code))
  const countriesForCurrency = countries.filter((item) => item.currencyCode === currency)

  const open = (target: HTMLElement) => {
    // Start from where the visitor is now.
    setCurrency(region.currencyCode)
    setCountry(countryCode)
    setAnchor(target)
  }

  const changeCurrency = (next: string) => {
    setCurrency(next)
    const options = countries.filter((item) => item.currencyCode === next)
    if (!options.some((item) => item.code === country)) setCountry(options[0]?.code ?? country)
  }

  const apply = () => {
    setAnchor(null)
    persistCountryCookie(country)
    if (country === countryCode) return
    const { pathname, search, hash } = window.location
    const rest = pathname.split("/").slice(2).join("/")
    router.push(`/${country}${rest ? `/${rest}` : ""}${search}${hash}`)
  }

  return (
    <>
      <Button
        color="inherit"
        size="small"
        startIcon={<Icon name="globe" fontSize="small" />}
        endIcon={<Icon name="chevronDown" sx={{ fontSize: 13 }} />}
        onClick={(event) => open(event.currentTarget)}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        aria-controls={anchor ? "currency-country-panel" : undefined}
        aria-label={`Currency ${region.currencyCode.toUpperCase()}. Change currency and country`}
        fullWidth={fullWidth}
        sx={{
          minHeight: 44,
          letterSpacing: "0.08em",
          fontWeight: 600,
          justifyContent: fullWidth ? "flex-start" : "center",
          "&:hover": { transform: "none" },
        }}
      >
        {region.currencyCode.toUpperCase()} · {countryCode.toUpperCase()}
      </Button>
      <Popover
        id="currency-country-panel"
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { role: "dialog", "aria-label": "Currency and country", sx: { width: 320, maxWidth: "calc(100vw - 32px)", borderRadius: 2.5, p: 2.5 } } }}
      >
        <Stack spacing={2}>
          <Typography variant="eyebrow" sx={{ color: "text.secondary" }}>
            Currency and country
          </Typography>
          <TextField select size="small" label="Currency" value={currency} onChange={(event) => changeCurrency(event.target.value)}>
            {currencies.map((code) => (
              <MenuItem key={code} value={code}>
                {code.toUpperCase()} · {CURRENCY_NAMES[code]}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="Country" value={country} onChange={(event) => setCountry(event.target.value)}>
            {countriesForCurrency.map((item) => (
              <MenuItem key={item.code} value={item.code}>
                {item.name}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={apply} disabled={country === countryCode}>
            Apply
          </Button>
        </Stack>
      </Popover>
    </>
  )
}
