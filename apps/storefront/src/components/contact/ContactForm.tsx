"use client"

import SendOutlinedIcon from "@mui/icons-material/SendOutlined"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import Snackbar from "@mui/material/Snackbar"
import TextField from "@mui/material/TextField"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { sdk } from "@/lib/medusa/sdk"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY = { name: "", email: "", order_number: "", subject: "", message: "", website: "" }

/** Re-mounts the form when a link pre-fills a different subject (e.g. "COA request: ..."). */
export default function ContactForm() {
  const subject = useSearchParams().get("subject") ?? ""
  return <ContactFormInner key={subject} initialSubject={subject} />
}

function ContactFormInner({ initialSubject }: { initialSubject: string }) {
  const [values, setValues] = useState(() => ({ ...EMPTY, subject: initialSubject }))
  const [showErrors, setShowErrors] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errors = {
    name: values.name.trim() ? undefined : "Required",
    email: EMAIL_PATTERN.test(values.email.trim()) ? undefined : "Enter a valid email address",
    message: values.message.trim().length >= 10 ? undefined : "Please write at least 10 characters",
  }
  const valid = !errors.name && !errors.email && !errors.message

  const bind = (name: keyof typeof EMPTY) => ({
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setValues({ ...values, [name]: event.target.value }),
    error: showErrors && Boolean(errors[name as keyof typeof errors]),
    helperText: showErrors ? errors[name as keyof typeof errors] : undefined,
  })

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setShowErrors(true)
    if (!valid) return
    setSending(true)
    setError(null)
    try {
      await sdk.client.fetch("/store/contact", {
        method: "POST",
        body: {
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim() || undefined,
          order_number: values.order_number.trim() || undefined,
          message: values.message.trim(),
          ...(values.website ? { website: values.website } : {}),
        },
      })
      setSent(true)
      setShowErrors(false)
      setValues(EMPTY)
    } catch {
      setError("We couldn't send your message. Please try again, or email us directly.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Box component="form" noValidate onSubmit={submit}>
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Name" required {...bind("name")} slotProps={{ htmlInput: { autoComplete: "name" } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Email" type="email" required {...bind("email")} slotProps={{ htmlInput: { autoComplete: "email" } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Subject (optional)" {...bind("subject")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Order or lot number (optional)" {...bind("order_number")} />
        </Grid>
        <Grid size={12}>
          <TextField label="Message" required multiline minRows={6} {...bind("message")} />
        </Grid>
        {/* Honeypot for bots: hidden from people and assistive tech. */}
        <Box aria-hidden sx={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}>
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              name="website"
              value={values.website}
              onChange={(event) => setValues({ ...values, website: event.target.value })}
            />
          </label>
        </Box>
      </Grid>
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={sending}
        startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />}
        sx={{ mt: 3 }}
      >
        {sending ? "Sending…" : "Send message"}
      </Button>
      <Snackbar
        open={sent}
        autoHideDuration={6000}
        onClose={() => setSent(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSent(false)}>
          Message sent. We usually reply within one business day.
        </Alert>
      </Snackbar>
    </Box>
  )
}
