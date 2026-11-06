"use client"
import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"


import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import Dialog from "@mui/material/Dialog"
import DialogActions from "@mui/material/DialogActions"
import DialogContent from "@mui/material/DialogContent"
import DialogTitle from "@mui/material/DialogTitle"
import FormControlLabel from "@mui/material/FormControlLabel"
import Radio from "@mui/material/Radio"
import RadioGroup from "@mui/material/RadioGroup"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { REPORT_REASONS } from "@/lib/community/format"
import { forumError } from "./useCommunityProfile"

/** Tells the moderators about a post. Three reports hide it until they review it. */
export default function ReportDialog({ postId, open, onClose, onReported }: { postId: string; open: boolean; onClose: () => void; onReported: () => void }) {
  const act = useTranslations("Actions")
  const [reason, setReason] = useState<string>("dose")
  const [note, setNote] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      await sdk.client.fetch(`/store/forum/posts/${encodeURIComponent(postId)}/report`, { method: "POST", body: { reason, note: note.trim() || null } })
      onReported()
      onClose()
    } catch (caught) {
      setError(forumError(caught, "We couldn't send your report. Please try again."))
    } finally {
      setSending(false)
    }
  }

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" aria-labelledby={`report-${postId}`}>
    <DialogTitle id={`report-${postId}`}>Report this post</DialogTitle>
    <DialogContent>
      <Typography sx={{ fontSize: 14.5, color: "brand.navySoft", mb: 1.5 }}>Moderators review every report. The author isn&apos;t told who reported them.</Typography>
      <RadioGroup value={reason} onChange={event => setReason(event.target.value)} aria-label={act("reason")}>
        {REPORT_REASONS.map(option => <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={translateAction(act, option.label)} />)}
      </RadioGroup>
      <TextField label={act("extraDetails")} value={note} onChange={event => setNote(event.target.value.slice(0, 500))} multiline minRows={2} fullWidth sx={{ mt: 1.5 }} />
      {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}>
      <Button onClick={onClose}>{act("cancel")}</Button>
      <Button variant="contained" onClick={() => void send()} disabled={sending}>{sending ? act("sending") : act("sendReport")}</Button>
    </DialogActions>
  </Dialog>
}
