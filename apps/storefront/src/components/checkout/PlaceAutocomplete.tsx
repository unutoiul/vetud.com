"use client"

import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { newSessionToken, type PlaceSuggestion } from "@/lib/places"

type Props = {
  id: string
  name: string
  label: string
  value: string
  required?: boolean
  error?: boolean
  helperText?: string
  /** Browser autofill hint, for example "address-line1" or "postal-code". */
  autoComplete?: string
  /** Fetches suggestions for the text typed so far. Called after a short pause. */
  suggest: (text: string, sessionToken: string, signal: AbortSignal) => Promise<PlaceSuggestion[]>
  onTextChange: (text: string) => void
  /** The visitor picked a suggestion. The session token is the one the suggestions were fetched with. */
  onPick: (suggestion: PlaceSuggestion, sessionToken: string) => void
  minCharacters?: number
}

const DEBOUNCE_MS = 250

/**
 * A text field with Google suggestions underneath. Re-mount it (change its `key`) when the inputs
 * that shape the suggestions change, for example the selected country. If suggestions fail, the
 * field keeps working as a normal text input.
 */
export default function PlaceAutocomplete({ id, name, label, value, required, error, helperText, autoComplete, suggest, onTextChange, onPick, minCharacters = 3 }: Props) {
  const [options, setOptions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const session = useRef(newSessionToken())
  const typed = useRef(false)
  // Always call the latest `suggest` without restarting the debounce on every render.
  const latestSuggest = useRef(suggest)
  useEffect(() => {
    latestSuggest.current = suggest
  })

  useEffect(() => {
    // Only ask while the visitor is typing, not when a pick or a saved address fills the field.
    if (!typed.current || value.trim().length < minCharacters) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      latestSuggest.current(value.trim(), session.current, controller.signal)
        .then(setOptions)
        .catch((caught) => {
          if (!(caught instanceof DOMException && caught.name === "AbortError")) setOptions([])
        })
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [value, minCharacters])

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
          onPick(picked, token)
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
              // MUI gives the input its own generated id; ours is what the label, the focus-on-error
              // logic and the tests use.
              htmlInput: { ...params.slotProps.htmlInput, id, autoComplete: autoComplete ? `${name.split("-")[0]} ${autoComplete}` : undefined },
            }}
          />
        )}
      />
      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 1.75 }}>
        Suggestions powered by Google
      </Typography>
    </Box>
  )
}
