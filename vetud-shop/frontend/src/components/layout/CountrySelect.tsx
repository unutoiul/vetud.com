"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Icon from "@/components/brand/Icon"
import { useLocale, useTranslations } from "next-intl"
import Button from "@mui/material/Button"
import MenuItem from "@mui/material/MenuItem"
import Popover from "@mui/material/Popover"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { clearCurrencyCookie, persistCountryCookie, persistCurrencyCookie } from "@/lib/country-cookie"
import { isStoreCurrency } from "@/lib/store-segment"
import { useStore } from "../store/StoreProvider"

/**
 * Two independent choices (owner's request, 2026-11-05): the country sets the language, delivery
 * and address format; the currency (USD, EUR or GBP) is the shopper's own, in any country. Apply
 * remembers both and reloads the page so prices, cart and checkout switch together.
 */
export default function CountrySelect({ fullWidth }: { fullWidth?: boolean }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Common")
  const locale = useLocale()
  const router = useRouter()
  const { countryCode, countries, region } = useStore()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [currency, setCurrency] = useState(region.currencyCode)
  const [country, setCountry] = useState(countryCode)
  // Until the shopper picks a currency, it follows the country (Germany suggests EUR).
  const [currencyPicked, setCurrencyPicked] = useState(false)
  const homeCurrency = (code: string) => countries.find((item) => item.code === code)?.currencyCode.toLowerCase()

  // The currencies of the store's regions, named by Intl in the page's language.
  const currencies = [...new Set(countries.map((item) => item.currencyCode.toLowerCase()))].sort((a, b) => ["usd", "eur", "gbp"].indexOf(a) - ["usd", "eur", "gbp"].indexOf(b))
  const currencyName = new Intl.DisplayNames([locale], { type: "currency" })
  const countryName = new Intl.DisplayNames([locale], { type: "region" })
  const sortedCountries = [...countries].sort((a, b) => (countryName.of(a.code.toUpperCase()) ?? a.name).localeCompare(countryName.of(b.code.toUpperCase()) ?? b.name, locale))
  const changed = country !== countryCode || currency !== region.currencyCode

  const open = (target: HTMLElement) => {
    // Start from where the visitor is now.
    setCurrency(region.currencyCode)
    setCountry(countryCode)
    setCurrencyPicked(false)
    setAnchor(target)
  }

  const changeCountry = (next: string) => {
    setCountry(next)
    const home = homeCurrency(next)
    if (!currencyPicked && home) setCurrency(home)
  }

  const apply = () => {
    setAnchor(null)
    if (!changed) return
    persistCountryCookie(country)
    // A currency the shopper picked is kept for every country; a suggested one leaves the country's own in charge.
    if (currencyPicked && isStoreCurrency(currency)) persistCurrencyCookie(currency)
    else if (currency === homeCurrency(country)) clearCurrencyCookie()
    else if (isStoreCurrency(currency)) persistCurrencyCookie(currency)
    const { pathname, search, hash } = window.location
    const rest = pathname.split("/").slice(2).join("/")
    // The proxy picks the page for the new currency; refresh drops pages cached in the old one.
    if (country !== countryCode) router.push(`/${country}${rest ? `/${rest}` : ""}${search}${hash}`)
    router.refresh()
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
        aria-label={act("currencySelector", { currency: region.currencyCode.toUpperCase(), country: countryCode.toUpperCase() })}
        fullWidth={fullWidth}
        sx={{
          minHeight: 44,
          letterSpacing: "0.08em",
          fontWeight: 600,
          justifyContent: fullWidth ? "flex-start" : "center",
          "&:hover": { transform: "none" },
        }}
      >
        {ct(region.currencyCode.toUpperCase())} · {ct(countryCode.toUpperCase())}
      </Button>
      <Popover
        id="currency-country-panel"
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { role: "dialog", "aria-label": "Country and currency", sx: { width: 320, maxWidth: "calc(100vw - 32px)", borderRadius: 2.5, p: 2.5 } } }}
      >
        <Stack spacing={2}>
          <Typography variant="eyebrow" sx={{ color: "text.secondary" }}>
            {t("country")} · {t("currency")}
          </Typography>
          <TextField select size="small" label={t("country")} value={country} onChange={(event) => changeCountry(event.target.value)}
            slotProps={{ select: { MenuProps: { slotProps: { paper: { sx: { maxHeight: 360 } } } } } }}>
            {sortedCountries.map((item) => (
              <MenuItem key={item.code} value={item.code}>
                {ct(countryName.of(item.code.toUpperCase()) ?? item.name)}
              </MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label={t("currency")} value={currency} onChange={(event) => { setCurrency(event.target.value); setCurrencyPicked(true) }}>
            {currencies.map((code) => (
              <MenuItem key={code} value={code}>
                {ct(code.toUpperCase())} · {ct(currencyName.of(code.toUpperCase()))}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" onClick={apply} disabled={!changed}>
            {t("apply")}
          </Button>
        </Stack>
      </Popover>
    </>
  )
}
