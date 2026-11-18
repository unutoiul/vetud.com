"use client"

import Autocomplete from "@mui/material/Autocomplete"
import InputAdornment from "@mui/material/InputAdornment"
import TextField from "@mui/material/TextField"
import { useContentTranslator } from "@/i18n/use-content-translator"
import CountryFlag from "./CountryFlag"
import { filterCountryChoices, renderCountryOption, useCountryChoices, type CountryChoice } from "./countries"

/**
 * A country you can type to find (by name, code or another common name), with its flag. The shared
 * look of text fields comes from the theme.
 */
export default function CountryField({ id, name, label, value, countries, onChange, required, error, helperText, disabled, autoComplete }: {
  id: string
  name: string
  label: string
  /** Lower-case ISO code, or "" when none is chosen. */
  value: string
  countries: { code: string }[]
  onChange: (code: string) => void
  required?: boolean
  error?: boolean
  helperText?: string
  disabled?: boolean
  autoComplete?: string
}) {
  const ct = useContentTranslator()
  const choices = useCountryChoices(countries)
  const selected = choices.find((choice) => choice.code === value) ?? null
  return <Autocomplete<CountryChoice, false, false, false>
    id={id}
    options={choices}
    value={selected}
    onChange={(_, choice) => { if (choice && choice.code !== value) onChange(choice.code) }}
    getOptionLabel={(choice) => choice.label}
    isOptionEqualToValue={(choice, current) => choice.code === current.code}
    filterOptions={filterCountryChoices}
    renderOption={renderCountryOption}
    autoHighlight
    openOnFocus
    disabled={disabled}
    noOptionsText={ct("No country matches")}
    renderInput={(params) => (
      <TextField
        {...params}
        name={name}
        label={label}
        required={required}
        error={error}
        helperText={helperText}
        slotProps={{
          ...params.slotProps,
          input: { ...params.slotProps.input, startAdornment: selected ? <InputAdornment position="start" sx={{ ml: 0.5, mr: 0.25 }}><CountryFlag code={selected.code} /></InputAdornment> : undefined },
          htmlInput: { ...params.slotProps.htmlInput, autoComplete },
        }}
      />
    )}
  />
}
