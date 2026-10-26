"use client"

import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { addressForPlace, newSessionToken, suggestAddresses, type PlaceSuggestion } from "@/lib/places"
import type { AddressValues } from "./AddressFields"

type Props = {
  id: string
  name: string
  label: string
  value: string
  required?: boolean
  error?: boolean
  helperText?: string
  autoComplete?: string
  /** ISO country codes we ship to; suggestions are limited to these. */
  countryCodes: string[]
  onTextChange: (text: string) => void
  /** Called with the fields of the suggestion the visitor picked. */
  onPick: (address: Partial<AddressValues>) => void
}

const MIN_CHARACTERS = 3
const DEBOUNCE_MS = 250

/**
 * The street-address field with Google address suggestions. Picking a suggestion fills in the
 * street, city, state, postal code and country. If suggestions fail or the key is rejected, the
 * field keeps working as a normal text input.
 */
export default function AddressAutocomplete({ id, name, label, value, required, error, helperText, autoComplete, countryCodes, onTextChange, onPick }: Props) {
  const [options, setOptions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const session = useRef(newSessionToken())
  const typed = useRef(false)
  const countriesKey = countryCodes.join(",")

  useEffect(() => {
    // Only ask for suggestions while the visitor is typing, not when a pick or saved address fills the field.
    if (!typed.current || value.trim().length < MIN_CHARACTERS) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      suggestAddresses(value.trim(), session.current, countriesKey ? countriesKey.split(",") : [], controller.signal)
        .then(setOptions)
        .catch((caught) => {
          if (!(caught instanceof DOMException && caught.name === "AbortError")) setOptions([])
        })
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [value, countriesKey])

  return (
    <Box>
      <Autocomplete<PlaceSuggestion, false, false, true>
        freeSolo
        fullWidth
        open={open && options.length > 0}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={options}
        // Google already ranks the suggestions, so show them as returned.
        filterOptions={(all) => all}
        getOptionLabel={(option) => (typeof option === "string" ? option : option.main)}
        getOptionKey={(option) => (typeof option === "string" ? option : option.placeId)}
        inputValue={value}
        onInputChange={(_event, text, reason) => {
          if (reason === "input") {
            typed.current = true
            onTextChange(text)
          }
        }}
        onChange={(_event, picked) => {
          if (!picked || typeof picked === "string") return
          typed.current = false
          setOptions([])
          const token = session.current
          session.current = newSessionToken()
          addressForPlace(picked.placeId, token)
            .then((address) => onPick(address))
            // Keep what the visitor typed if the details cannot be fetched.
            .catch(() => onTextChange(picked.main))
        }}
        renderOption={(props, option) => {
          const { key, ...rest } = props as typeof props & { key: string }
          return (
            <li key={key} {...rest}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{option.main}</Typography>
                {option.secondary ? <Typography variant="body2" sx={{ color: "text.secondary" }}>{option.secondary}</Typography> : null}
              </Box>
            </li>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            id={id}
            name={name}
            label={label}
            required={required}
            error={error}
            helperText={helperText}
            slotProps={{
              ...params.slotProps,
              htmlInput: { ...params.slotProps.htmlInput, autoComplete: autoComplete ? `${name.split("-")[0]} ${autoComplete}` : undefined },
            }}
          />
        )}
      />
      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 1.75 }}>
        Address suggestions powered by Google
      </Typography>
    </Box>
  )
}
