"use client"

import Grid from "@mui/material/Grid"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import { PLACES_ENABLED } from "@/lib/places"
import AddressAutocomplete from "./AddressAutocomplete"

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
}

export default function AddressFields({ prefix, values, errors, countries, onChange }: AddressFieldsProps) {
  const field = (name: keyof AddressValues, label: string, options: { autoComplete?: string; required?: boolean } = {}) => ({
    id: `${prefix}-${name}`,
    name: `${prefix}-${name}`,
    label,
    value: values[name],
    required: options.required,
    error: Boolean(errors[name]),
    helperText: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [name]: event.target.value }),
    slotProps: { htmlInput: { autoComplete: options.autoComplete ? `${prefix} ${options.autoComplete}` : undefined } },
  })

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField {...field("first_name", "First name", { autoComplete: "given-name", required: true })} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField {...field("last_name", "Last name", { autoComplete: "family-name", required: true })} />
      </Grid>
      <Grid size={12}>
        {PLACES_ENABLED ? (
          <AddressAutocomplete
            id={`${prefix}-address_1`}
            name={`${prefix}-address_1`}
            label="Address"
            value={values.address_1}
            required
            error={Boolean(errors.address_1)}
            helperText={errors.address_1}
            autoComplete="address-line1"
            countryCodes={countries.map((country) => country.code)}
            onTextChange={(text) => onChange({ ...values, address_1: text })}
            onPick={(picked) => {
              const known = countries.some((country) => country.code === picked.country_code)
              onChange({ ...values, ...picked, country_code: known ? picked.country_code ?? values.country_code : values.country_code })
            }}
          />
        ) : (
          <TextField {...field("address_1", "Address", { autoComplete: "address-line1", required: true })} />
        )}
      </Grid>
      <Grid size={12}>
        <TextField {...field("address_2", "Apartment, suite, building (optional)", { autoComplete: "address-line2" })} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField {...field("city", "City", { autoComplete: "address-level2", required: true })} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField
          {...field("province", values.country_code === "us" ? "State" : "State / province (optional)", {
            autoComplete: "address-level1",
            required: values.country_code === "us",
          })}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField {...field("postal_code", "Postal code", { autoComplete: "postal-code", required: true })} />
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField select {...field("country_code", "Country", { autoComplete: "country", required: true })}>
          {countries.map((country) => (
            <MenuItem key={country.code} value={country.code}>
              {country.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid size={12}>
        <TextField {...field("phone", "Phone (optional, for delivery questions)", { autoComplete: "tel" })} type="tel" />
      </Grid>
    </Grid>
  )
}
