"use client"

import Checkbox from "@mui/material/Checkbox"
import FormControlLabel from "@mui/material/FormControlLabel"
import Grid from "@mui/material/Grid"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import { useState } from "react"
import {
  findPostalCode,
  PLACES_ENABLED,
  placeDetails,
  STATE_COUNTRIES,
  suggestAddresses,
  suggestPostalCodes,
  type PlaceLocation,
} from "@/lib/places"
import PlaceAutocomplete from "./PlaceAutocomplete"

export type AddressValues = {
  first_name: string
  last_name: string
  company: string
  address_1: string
  address_2: string
  city: string
  province: string
  postal_code: string
  country_code: string
  phone: string
}

export const EMPTY_ADDRESS: AddressValues = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  country_code: "",
  phone: "",
}

const REQUIRED: (keyof AddressValues)[] = ["first_name", "last_name", "address_1", "city", "postal_code", "country_code"]

export function validateAddress(values: AddressValues) {
  const errors: Partial<Record<keyof AddressValues, string>> = {}
  for (const field of REQUIRED) {
    if (!values[field].trim()) errors[field] = "Required"
  }
  if (values.country_code === "us" && !values.province.trim()) {
    errors.province = "Required"
  }
  return errors
}

/** Accepts a Medusa address (nullable fields) and fills in blanks. */
export function toAddressValues(address?: Partial<Record<keyof AddressValues, string | null>> | null): AddressValues {
  const values = { ...EMPTY_ADDRESS }
  if (!address) return values
  for (const key of Object.keys(values) as (keyof AddressValues)[]) {
    values[key] = address[key] ?? ""
  }
  return values
}

type AddressFieldsProps = {
  prefix: string
  values: AddressValues
  errors: Partial<Record<keyof AddressValues, string>>
  countries: { code: string; name: string }[]
  onChange: (values: AddressValues) => void
  /**
   * The signed-in customer's details. The address is delivered to this name and phone unless the
   * visitor ticks "different name"; the phone field only appears when there is none on the profile.
   */
  defaults?: { first_name?: string | null; last_name?: string | null; phone?: string | null }
}

export default function AddressFields({ prefix, values, errors, countries, onChange, defaults }: AddressFieldsProps) {
  const profileName = Boolean(defaults?.first_name?.trim() && defaults?.last_name?.trim())
  const [differentName, setDifferentName] = useState(
    !profileName || Boolean(values.first_name && (values.first_name !== defaults?.first_name || values.last_name !== defaults?.last_name))
  )
  // Where the chosen postal code is, so street suggestions come from that area.
  const [near, setNear] = useState<PlaceLocation | undefined>()
  const country = values.country_code
  const hasState = STATE_COUNTRIES.has(country)
  const hasProfilePhone = Boolean(defaults?.phone?.trim())

  const set = (changes: Partial<AddressValues>) => onChange({ ...values, ...changes })

  const field = (name: keyof AddressValues, label: string, options: { autoComplete?: string; required?: boolean } = {}) => ({
    id: `${prefix}-${name}`,
    name: `${prefix}-${name}`,
    label,
    value: values[name],
    required: options.required,
    error: Boolean(errors[name]),
    helperText: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => set({ [name]: event.target.value }),
    slotProps: { htmlInput: { autoComplete: options.autoComplete ? `${prefix} ${options.autoComplete}` : undefined } },
  })

  const suggestionsOn = PLACES_ENABLED && Boolean(country)

  return (
    <Grid container spacing={2}>
      <Grid size={12}>
        <TextField
          select
          {...field("country_code", "Country", { autoComplete: "country", required: true })}
          onChange={(event) => {
            setNear(undefined)
            const next = event.target.value
            set({ country_code: next, province: STATE_COUNTRIES.has(next) ? values.province : "" })
          }}
        >
          {countries.map((option) => (
            <MenuItem key={option.code} value={option.code}>
              {option.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid size={12}>
        {suggestionsOn ? (
          // Re-mounting on country change clears suggestions from the previous country.
          <PlaceAutocomplete
            key={`${prefix}-address-${country}`}
            id={`${prefix}-address_1`}
            name={`${prefix}-address_1`}
            label="Address"
            value={values.address_1}
            required
            error={Boolean(errors.address_1)}
            helperText={errors.address_1}
            autoComplete="address-line1"
            suggest={(text, token, signal) => suggestAddresses(text, token, country, signal, near)}
            onTextChange={(text) => set({ address_1: text })}
            onPick={(picked, token) => {
              placeDetails(picked.placeId, token)
                .then(async ({ address, location }) => {
                  if (location) setNear(location)
                  const known = countries.some((option) => option.code === address.country_code)
                  const filled = { ...address, country_code: known ? address.country_code ?? country : country }
                  // Google sometimes matches a street without a postal code; look the exact address up.
                  const postal_code = filled.postal_code || (await findPostalCode(filled).catch(() => ""))
                  onChange({ ...values, ...filled, postal_code, province: STATE_COUNTRIES.has(filled.country_code ?? "") ? filled.province ?? "" : "" })
                })
                .catch(() => set({ address_1: picked.main }))
            }}
          />
        ) : (
          <TextField {...field("address_1", "Address", { autoComplete: "address-line1", required: true })} />
        )}
      </Grid>

      <Grid size={12}>
        <TextField {...field("address_2", "Apartment, suite, building (optional)", { autoComplete: "address-line2" })} />
      </Grid>

      <Grid size={{ xs: 12, sm: 5 }}>
        {suggestionsOn ? (
          <PlaceAutocomplete
            key={`${prefix}-postal-${country}`}
            id={`${prefix}-postal_code`}
            name={`${prefix}-postal_code`}
            label="Postal code"
            value={values.postal_code}
            required
            error={Boolean(errors.postal_code)}
            helperText={errors.postal_code}
            autoComplete="postal-code"
            minCharacters={2}
            suggest={(text, token, signal) => suggestPostalCodes(text, token, country, signal)}
            onTextChange={(text) => set({ postal_code: text })}
            onPick={(picked, token) => {
              placeDetails(picked.placeId, token)
                .then(({ address, location }) => {
                  if (location) setNear(location)
                  onChange({
                    ...values,
                    postal_code: address.postal_code || picked.main,
                    city: address.city || values.city,
                    province: STATE_COUNTRIES.has(country) ? address.province || values.province : "",
                  })
                })
                .catch(() => set({ postal_code: picked.main }))
            }}
          />
        ) : (
          <TextField {...field("postal_code", "Postal code", { autoComplete: "postal-code", required: true })} />
        )}
      </Grid>
      <Grid size={{ xs: 12, sm: 7 }}>
        <TextField {...field("city", "City", { autoComplete: "address-level2", required: true })} />
      </Grid>

      {hasState ? (
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            {...field("province", country === "us" ? "State" : "State / province", {
              autoComplete: "address-level1",
              required: country === "us",
            })}
          />
        </Grid>
      ) : null}

      {profileName ? (
        <Grid size={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={differentName}
                onChange={(event) => {
                  setDifferentName(event.target.checked)
                  // Unticking goes back to the name on the account.
                  if (!event.target.checked) set({ first_name: defaults?.first_name ?? "", last_name: defaults?.last_name ?? "" })
                }}
              />
            }
            label={`Deliver to a different name (now: ${defaults?.first_name} ${defaults?.last_name})`}
          />
        </Grid>
      ) : null}
      {differentName ? (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField {...field("first_name", "First name", { autoComplete: "given-name", required: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField {...field("last_name", "Last name", { autoComplete: "family-name", required: true })} />
          </Grid>
        </>
      ) : null}

      {hasProfilePhone ? null : (
        <Grid size={12}>
          <TextField {...field("phone", "Phone (optional, for delivery questions)", { autoComplete: "tel" })} type="tel" />
        </Grid>
      )}
    </Grid>
  )
}
