"use client"

import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { getCountryRules } from "@/i18n/config"
import { normalizePostal, provincesOf, type AddressValues } from "@/lib/address"
import { findPostalCode, PLACES_ENABLED, placeDetails, suggestAddresses, suggestPostalCodes, type PlaceLocation } from "@/lib/places"
import PhoneField from "../common/PhoneField"
import PlaceAutocomplete from "./PlaceAutocomplete"

export { EMPTY_ADDRESS, toAddressValues, validateAddress, normalizeAddress, type AddressValues } from "@/lib/address"

type Props = {
  prefix: string; values: AddressValues; errors: Partial<Record<keyof AddressValues, string>>;
  countries: { code: string; name: string }[]; onChange: (values: AddressValues) => void;
  defaults?: { first_name?: string | null; last_name?: string | null; phone?: string | null }
}

export default function AddressFields({ prefix, values, errors, countries, onChange }: Props) {
  const t = useTranslations("Address")
  const locale = useLocale()
  const rules = getCountryRules(values.country_code)
  const [near, setNear] = useState<PlaceLocation>()
  const latest = useRef({ values, onChange })
  const requestVersion = useRef(0)
  useEffect(() => { latest.current = { values, onChange } }, [values, onChange])
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
  const pick = async (picked: { placeId: string; main: string }, token: string, postalOnly = false) => {
    const initial = latest.current.values
    const version = ++requestVersion.current
    const key = postalOnly ? "postal_code" : "address_1"
    // Still the latest pick, and the visitor hasn't edited or cleared the field while the details loaded.
    const active = () => {
      const now = latest.current.values
      return version === requestVersion.current && now.country_code === country && (now[key] === initial[key] || now[key] === picked.main)
    }
    try {
      const { address, location } = await placeDetails(picked.placeId, token, locale)
      if (!active() || (address.country_code && address.country_code !== country)) return
      const postal = address.postal_code || (postalOnly ? picked.main : await findPostalCode({ ...address, country_code: country }, undefined, locale).catch(() => ""))
      if (!active()) return
      if (location) setNear(location)
      const previous = latest.current.values
      latest.current.onChange({
        ...previous,
        ...(!postalOnly ? { address_1: address.address_1 || picked.main, address_2: address.address_2 || previous.address_2 } : {}),
        city: previous.city !== initial.city ? previous.city : address.city || previous.city,
        postal_code: normalizePostal(postal || previous.postal_code, country),
        province: rules.provinceRequired || rules.provinceOptional ? address.province || previous.province : "",
      })
    } catch {
      if (active()) latest.current.onChange({ ...latest.current.values, [key]: picked.main })
    }
  }
  const postalHelp = rules.postalExample ? t("postalHelp", { example: rules.postalExample }) : undefined
  const postalField = suggestionsOn ? <PlaceAutocomplete key={`${prefix}-postal-${country}`} id={`${prefix}-postal_code`} name={`${prefix}-postal_code`} label={t(rules.postalLabel as "postal" | "zip" | "postcode")} value={values.postal_code} required={!rules.postalOptional} error={Boolean(errors.postal_code)} helperText={errors.postal_code || postalHelp} autoComplete={autocomplete("postal-code")} minCharacters={2} suggest={(text, token, signal) => suggestPostalCodes(text, token, country, signal, locale)} onTextChange={text => set({ postal_code: text })} onPick={(picked, token) => void pick(picked, token, true)} /> : <TextField {...field("postal_code", t(rules.postalLabel as "postal" | "zip" | "postcode"), "postal-code", !rules.postalOptional)} helperText={errors.postal_code || postalHelp} onBlur={() => set({ postal_code: normalizePostal(values.postal_code, country) })} />
  const cityField = <TextField {...field("city", t(rules.cityLabel as "city" | "town"), "address-level2", true)} />
  return <Box>
    <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 2 }}>{t("autofill")}</Typography>
    <Grid container spacing={2}>
      <Grid size={12}><TextField select {...field("country_code", t("country"), "country", true)} onChange={event => {
        requestVersion.current += 1
        setNear(undefined)
        onChange({ ...values, country_code: event.target.value, province: "", postal_code: "", city: "", address_1: "", address_2: "" })
      }}>{sortedCountries.map(option => <MenuItem key={option.code} value={option.code}>{option.label}</MenuItem>)}</TextField></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField {...field("first_name", t("firstName"), "given-name", true)} /></Grid>
      <Grid size={{ xs: 12, sm: 6 }}><TextField {...field("last_name", t("lastName"), "family-name", true)} /></Grid>
      <Grid size={12}>{suggestionsOn ? <PlaceAutocomplete key={`${prefix}-address-${country}`} id={`${prefix}-address_1`} name={`${prefix}-address_1`} label={t("address")} value={values.address_1} required error={Boolean(errors.address_1)} helperText={errors.address_1 || t("addressHelp")} autoComplete={autocomplete("address-line1")} suggest={(text, token, signal) => suggestAddresses(text, token, country, signal, near, locale)} onTextChange={text => set({ address_1: text })} onPick={(picked, token) => void pick(picked, token)} /> : <TextField {...field("address_1", t("address"), "address-line1", true)} helperText={errors.address_1 || t("addressHelp")} />}</Grid>
      <Grid size={12}><TextField {...field("address_2", t("address2"), "address-line2")} /></Grid>
      <Grid size={{ xs: 12, sm: rules.postalBeforeCity ? 5 : 7 }}>{rules.postalBeforeCity ? postalField : cityField}</Grid>
      <Grid size={{ xs: 12, sm: rules.postalBeforeCity ? 7 : 5 }}>{rules.postalBeforeCity ? cityField : postalField}</Grid>
      {rules.provinceRequired ? <Grid size={12}><TextField select {...field("province", t(country === "us" ? "state" : "region"), "address-level1", true)}>{Object.entries(provincesOf(country)).map(([code, name]) => <MenuItem key={code} value={code}>{name}</MenuItem>)}</TextField></Grid>
        : rules.provinceOptional ? <Grid size={12}><TextField {...field("province", t("region"), "address-level1")} /></Grid> : null}
      <Grid size={12}><PhoneField id={`${prefix}-phone`} name={`${prefix}-phone`} country={country || "us"} value={values.phone} onChange={phone => set({ phone })} error={errors.phone} autoComplete={autocomplete("tel")} /></Grid>
    </Grid>
  </Box>
}
