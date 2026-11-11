"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import CircularProgress from "@mui/material/CircularProgress"
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
  onPick: (suggestion: PlaceSuggestion, sessionToken: string, signal: AbortSignal) => Promise<void>
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
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "empty" | "error" | "details" | "filled">("idle")
  const session = useRef(newSessionToken())
  const typed = useRef(false)
  const detailsRequest = useRef<AbortController | null>(null)
  const focused = useRef(false)
  // Always call the latest `suggest` without restarting the debounce on every render.
  const latestSuggest = useRef(suggest)
  useEffect(() => {
    latestSuggest.current = suggest
  })

  useEffect(() => {
    // Only ask while the visitor is typing, not when a pick or a saved address fills the field.
    if (!typed.current || !focused.current || value.trim().length < minCharacters) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      latestSuggest.current(value.trim(), session.current, controller.signal)
        .then(results => {
          if (controller.signal.aborted) return
          setOptions(results)
          setStatus(results.length ? "ready" : "empty")
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setOptions([])
          setStatus("error")
        })
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [value, minCharacters])

  useEffect(() => () => { detailsRequest.current?.abort() }, [])

  const feedback = status === "error" ? ct("Address search is unavailable. Type your address below to continue.")
    : status === "empty" ? ct("No matching addresses. You can enter your address manually.")
    : status === "loading" ? ct("Searching addresses...")
    : status === "details" ? ct("Filling in your address...")
    : status === "filled" ? ct("Check the address details below and add anything missing.") : ""

  return (
    <Box>
      <Autocomplete<PlaceSuggestion, false, false, true>
        freeSolo
        fullWidth
        open={open && options.length > 0}
        onOpen={() => { if (focused.current) setOpen(true) }}
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
            detailsRequest.current?.abort()
            typed.current = true
            setOptions([])
            setStatus(text.trim().length < minCharacters ? "idle" : "loading")
            setOpen(true)
            onTextChange(text)
          } else if (reason === "clear") {
            // The clear (×) button: empty the form value, not just MUI's copy of the text.
            typed.current = false
            detailsRequest.current?.abort()
            setStatus("idle")
            setOptions([])
            setOpen(false)
            onTextChange("")
          }
        }}
        onChange={(_event, picked) => {
          if (!picked || typeof picked === "string") return
          typed.current = false
          setOptions([])
          setOpen(false)
          setStatus("details")
          detailsRequest.current?.abort()
          const controller = new AbortController()
          detailsRequest.current = controller
          const token = session.current
          session.current = newSessionToken()
          onTextChange(picked.main)
          void onPick(picked, token, controller.signal).then(() => {
            if (!controller.signal.aborted) setStatus("filled")
          }).catch(() => {
            if (!controller.signal.aborted) setStatus("error")
          })
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
            onFocus={() => { focused.current = true; setOpen(true) }}
            onBlur={() => { focused.current = false; setOpen(false); setStatus(previous => previous === "loading" ? "idle" : previous) }}
            slotProps={{
              ...params.slotProps,
              input: { ...params.slotProps.input, endAdornment: <>{status === "loading" || status === "details" ? <CircularProgress size={18} color="inherit" aria-label={ct("Looking up address")} /> : null}{params.slotProps.input.endAdornment}</> },
              // MUI gives the input its own generated id; ours is what the label, the focus-on-error
              // logic and the tests use.
              htmlInput: { ...params.slotProps.htmlInput, id, autoComplete: autoComplete },
            }}
          />
        )}
      />
      <Typography variant="caption" role="status" aria-live="polite" sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 1.75 }}>{feedback}</Typography>
      {options.length > 0 && open ? <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5, ml: 1.75 }}>{t("google")}</Typography> : null}
    </Box>
  )
}
