"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useState, type FormEvent } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { findDose } from "@/lib/community/format"
import { isMetricId, METRICS, toCanonical, unitLabel, type MetricId } from "@/lib/community/metrics"
import type { ForumMeasurement, ForumThread, ForumThreadDetail } from "@/lib/community/types"
import { forumError } from "./useCommunityProfile"

/** The log author's progress update: this week's values for the measures they track, and a note. */
export default function CheckInForm({ thread, measurements, onAdded }: { thread: ForumThread; measurements: ForumMeasurement[]; onAdded: (detail: ForumThreadDetail) => void }) {
  const metrics = [...new Set(measurements.map(measurement => measurement.metric))].filter(isMetricId)
  const lastWeek = Math.max(0, ...measurements.map(measurement => measurement.week))
  const [open, setOpen] = useState(false)
  const [week, setWeek] = useState(String(lastWeek + 4))
  const [values, setValues] = useState<Partial<Record<MetricId, string>>>({})
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dose = findDose(note)

  if (!open) {
    return <Box sx={{ p: 2.5, border: "1px dashed", borderColor: "brand.blue", borderRadius: "10px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Typography sx={{ fontSize: 15, color: "brand.navySoft" }}>Keep your log going: add this week&apos;s measurements. Regular check-ins make the community charts more useful.</Typography>
      <Button variant="outlined" onClick={() => setOpen(true)}>Add a check-in</Button>
    </Box>
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const weekNumber = Number(week)
    const entries = metrics.flatMap(metric => {
      const raw = values[metric]?.replace(",", ".").trim()
      return raw ? [{ metric, value: toCanonical(metric, Number(raw), thread.unit_system) }] : []
    })
    if (!Number.isInteger(weekNumber) || weekNumber < 1 || weekNumber > 104) {
      setError("Enter the week of your log, from 1 to 104.")
      return
    }
    if (entries.some(entry => !Number.isFinite(entry.value))) {
      setError("Please enter numbers only.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const detail = await sdk.client.fetch<ForumThreadDetail>(`/store/forum/threads/${encodeURIComponent(thread.id)}/check-ins`, {
        method: "POST",
        body: { week: weekNumber, body: note.trim() || null, measurements: entries },
      })
      onAdded(detail)
      setOpen(false)
      setValues({})
      setNote("")
      setWeek(String(weekNumber + 4))
    } catch (caught) {
      setError(forumError(caught, "We couldn't save your check-in. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  return <Box component="form" noValidate onSubmit={submit} sx={{ p: { xs: 2.5, md: 3 }, border: "1px solid", borderColor: "divider", borderRadius: "10px", bgcolor: "#fff" }}>
    <Typography component="h3" sx={{ fontSize: 18, fontWeight: 650 }}>Add a check-in</Typography>
    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(180px, 1fr))" }, gap: 2 }}>
      <TextField label="Week of your log" value={week} onChange={event => setWeek(event.target.value.replace(/\D/g, "").slice(0, 3))} slotProps={{ htmlInput: { inputMode: "numeric" } }} helperText={`Last entry: week ${lastWeek}`} />
      {metrics.map(metric => <TextField key={metric} label={`${METRICS[metric].label} (${unitLabel(metric, thread.unit_system)})`} value={values[metric] ?? ""}
        onChange={event => setValues(current => ({ ...current, [metric]: event.target.value.replace(/[^\d.,]/g, "").slice(0, 7) }))}
        slotProps={{ htmlInput: { inputMode: "decimal" } }} helperText={METRICS[metric].hint || " "} />)}
    </Box>
    <TextField label="Note (optional)" value={note} onChange={event => setNote(event.target.value.slice(0, 5000))} multiline minRows={2} fullWidth sx={{ mt: 2 }}
      helperText="What changed? Side effects, sleep, how you feel. No doses." />
    {dose ? <Alert severity="warning" sx={{ mt: 1.5 }}>“{dose}” looks like a dose amount. Check-ins with doses wait for a moderator.</Alert> : null}
    {error ? <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>{error}</Alert> : null}
    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
      <Button type="submit" variant="contained" disabled={saving}>{saving ? "Saving…" : "Save check-in"}</Button>
      <Button onClick={() => setOpen(false)}>Cancel</Button>
    </Box>
  </Box>
}
