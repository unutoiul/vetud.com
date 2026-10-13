"use client"

import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Icon from "../brand/Icon"
import { useLocalizedHref } from "../common/links"

export default function LotLookupBand() {
  const router = useRouter()
  const localize = useLocalizedHref()
  const [lot, setLot] = useState("")
  return <Box sx={{ p: .75, borderRadius: 4, bgcolor: "#e9f0f3" }}>
    <Box sx={{ bgcolor: "#fff", borderRadius: 3.25, p: { xs: 3, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 3, md: 6 }, alignItems: "center" }}>
      <Stack direction="row" spacing={2.5} sx={{ alignItems: "flex-start" }}>
        <Box sx={{ display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: 2.5, bgcolor: "#edf4f7", flexShrink: 0 }}><Icon name="document" sx={{ fontSize: 28, color: "brand.blue" }} /></Box>
        <Box><Typography variant="h4" component="h2">Your vial. Its complete story.</Typography><Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>Find batch details and available certificates using the lot number on your label.</Typography></Box>
      </Stack>
      <Stack component="form" direction={{ xs: "column", sm: "row" }} spacing={1.5} onSubmit={(event) => { event.preventDefault(); const value = lot.trim(); router.push(localize(`/documentation${value ? `?lot=${encodeURIComponent(value)}` : ""}`)) }}>
        <TextField name="lot" autoComplete="off" value={lot} onChange={(event) => setLot(event.target.value)} placeholder="e.g. VTD01-2609A…" label="Lot number" slotProps={{ htmlInput: { autoCapitalize: "characters", spellCheck: false } }} />
        <Button type="submit" variant="contained" endIcon={<Icon name="arrowRight" />} sx={{ flexShrink: 0, minHeight: 56 }}>Find record</Button>
      </Stack>
    </Box>
  </Box>
}
