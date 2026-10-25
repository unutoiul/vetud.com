"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import Script from "next/script"
import { useSearchParams } from "next/navigation"
import { useRef, useState, type FormEvent } from "react"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import { normalizeTrackingNumber } from "@/lib/orders"

declare global {
  interface Window {
    YQV5?: { trackSingle: (input: { YQ_ContainerId: string; YQ_Height: number; YQ_Fc: string; YQ_Lang: string; YQ_Num: string }) => void }
  }
}

export default function TrackingForm() {
  const initialNumber = normalizeTrackingNumber(useSearchParams().get("number") ?? "")
  return <ParcelTrackingForm key={initialNumber} initialNumber={initialNumber} />
}

function ParcelTrackingForm({ initialNumber }: { initialNumber: string }) {
  const [number, setNumber] = useState(initialNumber)
  const [error, setError] = useState("")
  const [requested, setRequested] = useState(false)
  const [loading, setLoading] = useState(false)
  const submitted = useRef("")
  const showResults = () => {
    try {
      if (!window.YQV5) throw new Error("Tracking is unavailable")
      window.YQV5.trackSingle({ YQ_ContainerId: "parcel-tracking-results", YQ_Height: 560, YQ_Fc: "0", YQ_Lang: "en", YQ_Num: submitted.current })
      setLoading(false)
    } catch {
      setError("Tracking could not load. You can try again or open 17TRACK below.")
      setLoading(false)
    }
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleaned = normalizeTrackingNumber(number)
    if (!cleaned) { setError("Enter a valid parcel tracking number using letters and numbers."); return }
    setError("")
    submitted.current = cleaned
    setRequested(true)
    if (window.YQV5) showResults()
    else setLoading(true)
  }

  return <Box sx={{ maxWidth: 960, mx: "auto" }}>
    <Box component="form" onSubmit={submit} noValidate sx={{ maxWidth: 660, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "flex-start" } }}>
        <TextField label="Tracking number" value={number} onChange={(event) => { setNumber(event.target.value); setError("") }} error={Boolean(error)} helperText={error || "Find this in your shipping confirmation email."} fullWidth slotProps={{ htmlInput: { maxLength: 50, autoComplete: "off", spellCheck: false } }} />
        <Button type="submit" variant="contained" disabled={loading} endIcon={<Icon name="arrowRight" />} sx={{ minHeight: 56, flexShrink: 0 }}>{loading ? "Loading…" : "Track parcel"}</Button>
      </Stack>
      <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 2 }}>Results are provided by 17TRACK. Your tracking number is sent when you select Track parcel.</Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 3, mt: 2.5 }}><AppLink href="https://www.17track.net/en" target="_blank" rel="noopener noreferrer" sx={{ fontSize: 12 }}>Open 17TRACK</AppLink><AppLink href="/contact" sx={{ fontSize: 12 }}>Need help with your order?</AppLink></Stack>
    </Box>
    {requested && <Script src="https://www.17track.net/externalcall.js" strategy="afterInteractive" onReady={showResults} onError={() => { setLoading(false); setError("Tracking could not load. Open 17TRACK or contact us for help.") }} />}
    <Box id="parcel-tracking-results" aria-label="Parcel tracking results" aria-live="polite" sx={{ display: requested ? "block" : "none", mt: 5, minHeight: loading ? 100 : 0, "& iframe": { width: "100%", border: 0 } }} />
  </Box>
}
