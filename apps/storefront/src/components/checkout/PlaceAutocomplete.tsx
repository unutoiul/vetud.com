"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
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
  const ct = useContentTranslator()
  const t = useTranslations("Address")
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
        // The field is plain text owned by the form; a pick is handled in onChange and not kept as a
        // selection, so the clear button and the text never disagree.
        value={null}
        inputValue={value}
        onInputChange={(_event, text, reason) => {
          if (reason === "input") {
            typed.current = true
            // Suggestions for longer text would be stale once the text is too short to ask again.
            if (text.trim().length < minCharacters) setOptions([])
            onTextChange(text)
          } else if (reason === "clear") {
            // The clear (×) button: empty the form value, not just MUI's copy of the text.
            typed.current = false
            setOptions([])
            setOpen(false)
            onTextChange("")
          }
        }}
        onChange={(_event, picked) => {
          if (!picked || typeof picked === "string") return
          typed.current = false
          setOptions([])
          const token = session.current
          session.current = newSessionToken()
          onTextChange(picked.main)
          onPick(picked, token)
        }}
        renderOption={(props, option) => {
          const { key, ...rest } = props as typeof props & { key: string }
          return (
            <li key={key} {...rest}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{ct(option.main)}</Typography>
                {option.secondary ? <Typography variant="body2" sx={{ color: "text.secondary" }}>{ct(option.secondary)}</Typography> : null}
              </Box>
            </li>
          )
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            id={id}
            name={name}
            label={ct(label)}
            required={required}
            error={error}
            helperText={ct(helperText)}
            // MUI only reports a close while the list is showing. Suggestions that arrive after the
            // visitor has moved to another field must not open this list there.
            onBlur={() => setOpen(false)}
            slotProps={{
              ...params.slotProps,
              // MUI gives the input its own generated id; ours is what the label, the focus-on-error
              // logic and the tests use.
              htmlInput: { ...params.slotProps.htmlInput, id, autoComplete: autoComplete },
            }}
          />
        )}
      />
      <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 1.75 }}>
        {t("google")}
      </Typography>
    </Box>
  )
}
