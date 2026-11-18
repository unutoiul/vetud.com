"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import Box from "@mui/material/Box"
import InputAdornment from "@mui/material/InputAdornment"
import MenuItem from "@mui/material/MenuItem"
import Select from "@mui/material/Select"
import TextField from "@mui/material/TextField"
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js"
import metadata from "libphonenumber-js/min/metadata"
import { useLocale, useTranslations } from "next-intl"
import { useMemo, useState } from "react"
import { normalizePhone } from "@/lib/address"
import CountryFlag from "./CountryFlag"

const COUNTRIES = getCountries()
/** "1" → US, Canada and the rest of the North American plan; the first is the main country. */
const COUNTRIES_BY_CODE = (metadata as { country_calling_codes: Record<string, CountryCode[]> }).country_calling_codes

function callingCode(country: string) {
  try {
    return getCountryCallingCode(country.toUpperCase() as CountryCode)
  } catch {
    return ""
  }
}

/** The first country that uses a calling code; non-geographic codes (+800, shown as "001") have none. */
function mainCountry(code: string) {
  return COUNTRIES_BY_CODE[code]?.find((country) => COUNTRIES.includes(country))
}

/** The calling code a number starts with ("+44 7700…" → "44"). Codes are prefix-free, so only one fits. */
function codeOf(value: string) {
  const digits = /^\+(\d{1,3})/.exec(value.replace(/[\s().-]/g, ""))?.[1] ?? ""
  for (let length = 1; length <= digits.length; length++) {
    if (mainCountry(digits.slice(0, length))) return digits.slice(0, length)
  }
  return ""
}

/** The number after its "+code", as typed ("+44 7700 900123" → "7700 900123"). */
function withoutCode(value: string, code: string) {
  let rest = value.trim().slice(1)
  for (const digit of code) {
    rest = rest.replace(/^[\s().-]+/, "")
    if (rest.startsWith(digit)) rest = rest.slice(1)
  }
  return rest.replace(/^[\s().-]+/, "")
}

/**
 * A phone number with a calling-code picker in front of it (+1, +44). The code follows the country
 * chosen above until the shopper picks another one, and typing a number that starts with "+" sets
 * it too. The number is saved in full (+1 512 555 0100).
 */
export default function PhoneField({ country, value, onChange, error, label, required = false, id = "phone", name = "phone", autoComplete = "tel" }: {
  country: string; value: string; onChange: (value: string) => void; error?: string; label?: string; required?: boolean; id?: string; name?: string; autoComplete?: string
}) {
  const ct = useContentTranslator()
  const t = useTranslations("Address")
  const locale = useLocale()
  const [picked, setPicked] = useState<CountryCode | null>(null)
  const home = (callingCode(country) ? country.toUpperCase() : "") as CountryCode | ""
  const trimmed = value.trim()
  const valueCode = codeOf(trimmed)
  // Typing a "+" code by hand: the picker steps aside until the code is complete.
  const typingCode = trimmed.startsWith("+") && !valueCode
  const selected: CountryCode | "" = valueCode
    ? [picked, home].find((option): option is CountryCode => Boolean(option) && callingCode(option as string) === valueCode) ?? mainCountry(valueCode) ?? ""
    : picked ?? home
  const prefix = selected ? `+${callingCode(selected)}` : ""
  const shown = valueCode ? withoutCode(trimmed, valueCode) : value

  const options = useMemo(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" })
    return COUNTRIES
      .map((code) => ({ code, name: names.of(code) ?? code, dial: getCountryCallingCode(code) }))
      .sort((a, b) => a.name.localeCompare(b.name, locale))
  }, [locale])

  const change = (text: string) => {
    const typed = text.trimStart()
    if (!typed) return onChange("")
    if (typed.startsWith("+") || !prefix) return onChange(typed)
    onChange(`${prefix} ${typed}`)
  }

  const pick = (next: CountryCode) => {
    setPicked(next)
    const national = valueCode ? shown : trimmed.startsWith("+") ? "" : trimmed
    onChange(national ? `+${getCountryCallingCode(next)} ${national}` : "")
  }

  const picker = prefix && !typingCode ? (
    <InputAdornment position="start" sx={{ mr: 1, height: "auto", maxHeight: "none", alignSelf: "stretch", borderRight: "1px solid", borderColor: "divider" }}>
      <Select
        variant="standard"
        disableUnderline
        value={selected}
        onChange={(event) => pick(event.target.value as CountryCode)}
        renderValue={() => <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>{selected ? <CountryFlag code={selected} width={18} /> : null}{prefix}</Box>}
        SelectDisplayProps={{ "aria-label": ct("Country calling code") }}
        MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360, minWidth: 280 } } } }}
        sx={{
          color: "text.primary", fontVariantNumeric: "tabular-nums", height: "100%",
          "& .MuiSelect-select": { py: 0, pl: 0, display: "flex", alignItems: "center", minHeight: 0 },
          "& .MuiSelect-select:focus": { bgcolor: "transparent" },
        }}
      >
        {options.map((option) => (
          <MenuItem key={option.code} value={option.code} sx={{ gap: 1.25 }}>
            <CountryFlag code={option.code} />
            <Box component="span" sx={{ flex: 1, pr: 2 }}>{option.name}</Box>
            <Box component="span" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>+{option.dial}</Box>
          </MenuItem>
        ))}
      </Select>
    </InputAdornment>
  ) : undefined

  return <TextField
    id={id}
    name={name}
    type="tel"
    label={label ?? t("phone")}
    required={required}
    value={shown}
    onChange={event => change(event.target.value)}
    onBlur={() => onChange(normalizePhone(value, selected || country))}
    error={Boolean(error)}
    helperText={ct(error || t("phoneHelp"))}
    slotProps={{
      htmlInput: { autoComplete, inputMode: "tel" },
      input: { startAdornment: picker },
      // The code sits in the field, so the label always stays above it.
      inputLabel: picker ? { shrink: true } : undefined,
    }}
  />
}
