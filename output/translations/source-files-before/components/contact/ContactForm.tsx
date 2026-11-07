"use client"

import { SendIcon as SendOutlinedIcon } from "@/components/brand/Icon"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import Snackbar from "@mui/material/Snackbar"
import TextField from "@mui/material/TextField"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { sdk } from "@/lib/medusa/sdk"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMPTY = { name: "", email: "", order_number: "", subject: "", message: "", website: "" }

/** Re-mounts the form when a link pre-fills a different subject (e.g. "COA request: ..."). */
export default function ContactForm() {
  const subject = useSearchParams().get("subject") ?? ""
  return <ContactFormInner key={subject} initialSubject={subject} />
}

function ContactFormInner({ initialSubject }: { initialSubject: string }) {
  const t = useTranslations("Contact")
  const common = useTranslations("Common")
  const [values, setValues] = useState(() => ({ ...EMPTY, subject: initialSubject }))
  const [showErrors, setShowErrors] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const errors = {
    name: values.name.trim() ? undefined : t("required"),
    email: EMAIL_PATTERN.test(values.email.trim()) ? undefined : t("invalidEmail"),
    message: values.message.trim().length >= 10 ? undefined : t("short"),
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
    if (!valid) {
      const field = Object.keys(errors).find((key) => errors[key as keyof typeof errors])
      const input = field ? event.currentTarget.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${field}"]`) : null
      input?.focus()
      return
    }
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
      setError(t("error"))
    } finally {
      setSending(false)
    }
  }

  return (
    <Box component="form" noValidate onSubmit={submit} aria-busy={sending}>
      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label={t("name")} required {...bind("name")} slotProps={{ htmlInput: { autoComplete: "name" } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label={common("email")} type="email" required {...bind("email")} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label={t("subject")} {...bind("subject")} autoComplete="off" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label={t("order")} {...bind("order_number")} slotProps={{ htmlInput: { autoComplete: "off", spellCheck: false } }} />
        </Grid>
        <Grid size={12}>
          <TextField label={t("message")} required multiline minRows={6} {...bind("message")} autoComplete="off" />
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
        {sending ? t("sending") : t("send")}
      </Button>
      <Snackbar
        open={sent}
        autoHideDuration={6000}
        onClose={() => setSent(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSent(false)}>
          {t("success")}
        </Alert>
      </Snackbar>
    </Box>
  )
}
