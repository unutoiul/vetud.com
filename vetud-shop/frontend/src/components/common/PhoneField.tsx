"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import Autocomplete from "@mui/material/Autocomplete"
import ButtonBase from "@mui/material/ButtonBase"
import InputAdornment from "@mui/material/InputAdornment"
import Popover from "@mui/material/Popover"
import TextField from "@mui/material/TextField"
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js"
import metadata from "libphonenumber-js/min/metadata"
import { useTranslations } from "next-intl"
import { useRef, useState } from "react"
import { normalizePhone } from "@/lib/address"
import Icon from "../brand/Icon"
import CountryFlag from "./CountryFlag"
import { filterCountryChoices, InlineCountryList, renderCountryOption, useCountryChoices, type CountryChoice } from "./countries"

const COUNTRIES = getCountries()
/** "1" → US, Canada and the rest of the North American plan; the first is the main country. */
const COUNTRIES_BY_CODE = (metadata as { country_calling_codes: Record<string, CountryCode[]> }).country_calling_codes
/** Every country with a calling code, for the picker (a stable list, so its names are worked out once). */
const DIALLING = COUNTRIES.map((code) => ({ code, dial: getCountryCallingCode(code), main: mainCountry(getCountryCallingCode(code)) === code }))

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
 * A phone number with its calling code in front (+1, +44). The code follows the country chosen
 * above until the shopper picks another: clicking it opens a search where a country's name, its
 * letters (GB, UK) or the code itself (+44, 44) can be typed. Typing a number that starts with "+"
 * sets the code too. The number is saved in full (+1 512 555 0100).
 */
export default function PhoneField({ country, value, onChange, error, label, required = false, id = "phone", name = "phone", autoComplete = "tel" }: {
  country: string; value: string; onChange: (value: string) => void; error?: string; label?: string; required?: boolean; id?: string; name?: string; autoComplete?: string
}) {
  const ct = useContentTranslator()
  const t = useTranslations("Address")
  const [picked, setPicked] = useState<CountryCode | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [query, setQuery] = useState("")
  const numberInput = useRef<HTMLInputElement>(null)
  const choices = useCountryChoices(DIALLING)
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
  const selectedChoice = choices.find((choice) => choice.code === selected.toLowerCase()) ?? null

  const change = (text: string) => {
    const typed = text.trimStart()
    if (!typed) return onChange("")
    if (typed.startsWith("+") || !prefix) return onChange(typed)
    onChange(`${prefix} ${typed}`)
  }

  const pick = (choice: CountryChoice) => {
    const next = choice.code.toUpperCase() as CountryCode
    setPicked(next)
    const national = valueCode ? shown : trimmed.startsWith("+") ? "" : trimmed
    onChange(national ? `+${getCountryCallingCode(next)} ${national}` : "")
  }

  const closePicker = () => {
    setAnchor(null)
    // Back to the number, ready to type.
    window.setTimeout(() => numberInput.current?.focus(), 0)
  }

  const picker = prefix && !typingCode ? (
    <InputAdornment position="start" sx={{ height: "auto", maxHeight: "none", alignSelf: "stretch", mr: 1 }}>
      <ButtonBase
        aria-label={ct("Country calling code")}
        aria-haspopup="dialog"
        aria-expanded={Boolean(anchor)}
        onClick={(event) => { setQuery(""); setAnchor(event.currentTarget) }}
        sx={{
          alignSelf: "stretch", gap: 0.75, pl: 0.5, pr: 1, ml: -0.5, borderRight: "1px solid", borderColor: "divider", borderRadius: "4px 0 0 4px",
          color: "text.primary", font: "inherit", fontVariantNumeric: "tabular-nums", minWidth: 44,
          "&:hover": { bgcolor: "brand.mintWash" },
          "&.Mui-focusVisible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: -2 },
        }}
      >
        {selected ? <CountryFlag code={selected} /> : null}
        {prefix}
        <Icon name="chevronDown" sx={{ fontSize: 16, color: "text.secondary" }} />
      </ButtonBase>
    </InputAdornment>
  ) : undefined

  return <>
    <TextField
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
      inputRef={numberInput}
      slotProps={{
        htmlInput: { autoComplete, inputMode: "tel" },
        input: { startAdornment: picker },
        // The code sits in the field, so the label always stays above it.
        inputLabel: picker ? { shrink: true } : undefined,
      }}
    />
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={() => setAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{ paper: { role: "dialog", "aria-label": ct("Country calling code"), sx: { mt: 1, p: 1, width: 340, maxWidth: "calc(100vw - 32px)" } } }}
    >
      <Autocomplete<CountryChoice, false, true, false>
        open
        options={choices}
        value={selectedChoice ?? undefined}
        inputValue={query}
        onInputChange={(_, text, reason) => { if (reason === "input" || reason === "clear") setQuery(text) }}
        onChange={(_, choice) => { if (choice) { pick(choice); closePicker() } }}
        onClose={(_, reason) => { if (reason === "escape") closePicker() }}
        disableClearable
        forcePopupIcon={false}
        autoHighlight
        getOptionLabel={(choice) => choice.label}
        isOptionEqualToValue={(choice, current) => choice.code === current.code}
        filterOptions={filterCountryChoices}
        renderOption={renderCountryOption}
        noOptionsText={ct("No country matches")}
        slots={{ popper: InlineCountryList }}
        slotProps={{ paper: { sx: { boxShadow: "none", m: 0, mt: 1, borderRadius: 0 } }, listbox: { sx: { maxHeight: 300, p: 0 } } }}
        renderInput={(params) => (
          <TextField
            {...params}
            autoFocus
            size="small"
            placeholder={ct("Search country or code")}
            slotProps={{
              ...params.slotProps,
              input: { ...params.slotProps.input, startAdornment: <InputAdornment position="start"><Icon name="search" sx={{ fontSize: 18, color: "text.secondary" }} /></InputAdornment> },
              htmlInput: { ...params.slotProps.htmlInput, "aria-label": ct("Search country or code") },
            }}
          />
        )}
      />
    </Popover>
  </>
}
