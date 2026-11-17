"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import { getCountryCallingCode, type CountryCode } from "libphonenumber-js"
import { useTranslations } from "next-intl"
import { getCountryRules } from "@/i18n/config"
import { normalizePhone } from "@/lib/address"

/** "+1" for the US, "+44" for the UK; empty when the country isn't known. */
function callingPrefix(country: string) {
  const fromRules = getCountryRules(country).callingCode
  if (fromRules) return `+${String(fromRules).replace(/^\+/, "")}`
  try {
    return `+${getCountryCallingCode(country.toUpperCase() as CountryCode)}`
  } catch {
    return ""
  }
}

/**
 * A phone number with the country's calling code already in front of it (+1, +44), following the
 * country chosen above. The number is saved in full (+1 512 555 0100). Typing your own "+" code
 * (a number from another country) replaces the shown one.
 */
export default function PhoneField({ country, value, onChange, error, id = "phone", name = "phone", autoComplete = "tel" }: {
  country: string; value: string; onChange: (value: string) => void; error?: string; id?: string; name?: string; autoComplete?: string
}) {
  const ct = useContentTranslator()
  const t = useTranslations("Address")
  const prefix = callingPrefix(country)
  const trimmed = value.trim()
  // Calling codes are prefix-free, so "starts with +44" can only mean the UK code.
  const ownCode = Boolean(prefix) && trimmed.startsWith(prefix)
  const otherCode = trimmed.startsWith("+") && !ownCode
  const shown = ownCode ? trimmed.slice(prefix.length).trimStart() : value

  const change = (text: string) => {
    const typed = text.trimStart()
    if (!typed) return onChange("")
    if (typed.startsWith("+") || !prefix) return onChange(typed)
    onChange(`${prefix} ${typed}`)
  }

  return <TextField
    id={id}
    name={name}
    type="tel"
    label={t("phone")}
    value={shown}
    onChange={event => change(event.target.value)}
    onBlur={() => onChange(normalizePhone(value, country))}
    error={Boolean(error)}
    helperText={ct(error || t("phoneHelp"))}
    slotProps={{
      htmlInput: { autoComplete, inputMode: "tel" },
      input: { startAdornment: prefix && !otherCode ? <InputAdornment position="start" sx={{ color: "text.primary", fontVariantNumeric: "tabular-nums" }}>{prefix}</InputAdornment> : undefined },
      // The code sits in the field, so the label always stays above it.
      inputLabel: prefix && !otherCode ? { shrink: true } : undefined,
    }}
  />
}
