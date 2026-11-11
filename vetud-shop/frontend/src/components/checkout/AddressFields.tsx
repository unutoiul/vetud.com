"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef } from "react"
import { useLocale, useTranslations } from "next-intl"
import { getCountryRules } from "@/i18n/config"
import { changeAddressCountry, normalizePostal, provincesOf, type AddressValues } from "@/lib/address"
import { mergePlaceAddress, PLACES_ENABLED, placeDetails, suggestAddresses } from "@/lib/places"
import PhoneField from "../common/PhoneField"
import PlaceAutocomplete from "./PlaceAutocomplete"

export { EMPTY_ADDRESS, toAddressValues, validateAddress, normalizeAddress, type AddressValues } from "@/lib/address"

type Props = {
  prefix: string; values: AddressValues; errors: Partial<Record<keyof AddressValues, string>>;
  countries: { code: string; name: string }[]; onChange: (values: AddressValues) => void;
  defaults?: { first_name?: string | null; last_name?: string | null; phone?: string | null }
  fields?: (keyof AddressValues)[]
  showAutofillHint?: boolean
  disabled?: boolean
}

export default function AddressFields({ prefix, values, errors, countries, onChange, fields, showAutofillHint = true, disabled = false }: Props) {
  const ct = useContentTranslator()
  const t = useTranslations("Address")
  const locale = useLocale()
  const rules = getCountryRules(values.country_code)
  const visible = (field: keyof AddressValues) => !fields || fields.includes(field)
  const latest = useRef({ values, onChange, disabled })
  const requestVersion = useRef(0)
  useEffect(() => {
    latest.current = { values, onChange, disabled }
    if (disabled) requestVersion.current += 1
  }, [values, onChange, disabled])
  const set = (changes: Partial<AddressValues>) => {
    onChange({ ...values, ...changes })
  }
  const autocomplete = (name: string) => `section-${prefix} ${prefix === "billing" ? "billing" : "shipping"} ${name}`
  const field = (name: keyof AddressValues, label: string, autoComplete: string, required = false) => ({
    id: `${prefix}-${name}`, name: `${prefix}-${name}`, label, value: values[name], required,
    error: Boolean(errors[name]), helperText: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set({ [name]: event.target.value }),
    slotProps: { htmlInput: { autoComplete: autocomplete(autoComplete) } },
  })
  const country = values.country_code
  const regionNames = new Intl.DisplayNames([locale], { type: "region" })
  const sortedCountries = countries.map(option => ({ code: option.code, label: regionNames.of(option.code.toUpperCase()) ?? option.name })).sort((a, b) => a.label.localeCompare(b.label, locale))
  const suggestionsOn = PLACES_ENABLED && Boolean(country)
  const pick = async (picked: { placeId: string; main: string }, token: string, signal: AbortSignal) => {
    const initial = latest.current.values
    const version = ++requestVersion.current
    const { address } = await placeDetails(picked.placeId, token, locale, signal)
    const previous = latest.current.values
    if (signal.aborted || latest.current.disabled || version !== requestVersion.current || previous.country_code !== country || previous.address_1 !== picked.main) return
    if (address.country_code && address.country_code !== country) throw new Error("Address country mismatch")
    const next = mergePlaceAddress(previous, initial, address, picked.main)
    next.postal_code = normalizePostal(next.postal_code, country)
    if (!rules.provinceRequired && !rules.provinceOptional) next.province = ""
    latest.current = { ...latest.current, values: next }
    latest.current.onChange(next)
  }
  const postalHelp = rules.postalExample ? t("postalHelp", { example: rules.postalExample }) : undefined
  const postalField = <TextField {...field("postal_code", t(rules.postalLabel as "postal" | "zip" | "postcode"), "postal-code", !rules.postalOptional)} helperText={ct(errors.postal_code || postalHelp)} onBlur={() => set({ postal_code: normalizePostal(latest.current.values.postal_code, country) })} />
  const cityField = <TextField {...field("city", t(rules.cityLabel as "city" | "town"), "address-level2", true)} />
  return <Box>
    {showAutofillHint ? <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>{t("autofill")}</Typography> : null}
    <Grid container spacing={2}>
      {visible("country_code") ? <Grid size={12}><TextField select {...field("country_code", t("country"), "country", true)} value={sortedCountries.some(option => option.code === country) ? country : ""} onChange={event => {
        requestVersion.current += 1
        onChange(changeAddressCountry(values, event.target.value))
      }}>{sortedCountries.map(option => <MenuItem key={option.code} value={option.code}>{ct(option.label)}</MenuItem>)}</TextField></Grid> : null}
      {visible("first_name") ? <Grid size={{ xs: 12, sm: visible("last_name") ? 6 : 12 }}><TextField {...field("first_name", t("firstName"), "given-name", true)} /></Grid> : null}
      {visible("last_name") ? <Grid size={{ xs: 12, sm: visible("first_name") ? 6 : 12 }}><TextField {...field("last_name", t("lastName"), "family-name", true)} /></Grid> : null}
      {visible("address_1") ? <Grid size={12}>{suggestionsOn ? <PlaceAutocomplete key={`${prefix}-address-${country}`} id={`${prefix}-address_1`} name={`${prefix}-address_1`} label={t("address")} value={values.address_1} required error={Boolean(errors.address_1)} helperText={ct(errors.address_1 || t("addressHelp"))} autoComplete={autocomplete("address-line1")} suggest={(text, token, signal) => suggestAddresses(text, token, country, signal, undefined, locale)} onTextChange={text => set({ address_1: text })} onPick={pick} /> : <TextField {...field("address_1", t("address"), "address-line1", true)} helperText={ct(errors.address_1 || t("addressHelp"))} />}</Grid> : null}
      {visible("address_2") ? <Grid size={12}><TextField {...field("address_2", t("address2"), "address-line2")} /></Grid> : null}
      {(rules.postalBeforeCity ? ["postal_code", "city"] as const : ["city", "postal_code"] as const).filter(visible).map(name => <Grid key={name} size={{ xs: 12, sm: visible("city") && visible("postal_code") ? name === "city" ? 7 : 5 : 12 }}>{name === "city" ? cityField : postalField}</Grid>)}
      {visible("province") && rules.provinceRequired ? <Grid size={12}><TextField select {...field("province", t(country === "us" ? "state" : "region"), "address-level1", true)}>{Object.entries(provincesOf(country)).map(([code, name]) => <MenuItem key={code} value={code}>{ct(name)}</MenuItem>)}</TextField></Grid>
        : visible("province") && rules.provinceOptional ? <Grid size={12}><TextField {...field("province", t("region"), "address-level1")} /></Grid> : null}
      {visible("phone") ? <Grid size={12}><PhoneField id={`${prefix}-phone`} name={`${prefix}-phone`} country={country || "us"} value={values.phone} onChange={phone => set({ phone })} error={errors.phone} autoComplete={autocomplete("tel")} /></Grid> : null}
    </Grid>
  </Box>
}
