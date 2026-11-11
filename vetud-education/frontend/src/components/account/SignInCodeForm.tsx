"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Icon from "../brand/Icon"
import { useAccount } from "./AccountProvider"

/** Seconds before another code can be sent; the backend refuses sooner requests. */
const RESEND_SECONDS = 30

/** The second sign-in step: the 6-digit code from the email. */
export default function SignInCodeForm() {
  const ct = useContentTranslator()
  const { codeStep, verifyCode, resendCode, cancelCode, pending, error, clearError } = useAccount()
  const [code, setCode] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [wait, setWait] = useState(RESEND_SECONDS)
  const [sentAgain, setSentAgain] = useState(false)

  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    clearError()
    const digits = code.replace(/\D/g, "")
    if (digits.length !== 6) {
      setFormError(ct("Enter the 6-digit code from the email."))
      return
    }
    try {
      await verifyCode(digits)
    } catch {
      setCode("")
    }
  }

  const sendAgain = async () => {
    setFormError(null)
    setSentAgain(false)
    clearError()
    try {
      await resendCode()
      setCode("")
      setSentAgain(true)
      setWait(RESEND_SECONDS)
    } catch {
      // The message is shown from the account state.
    }
  }

  const message = formError || error
  return (
    <Box component="form" onSubmit={submit} noValidate>
      <Typography sx={{ color: "text.secondary", mb: 2.5, lineHeight: 1.7 }}>
        {ct.template("We sent a 6-digit code to {v0}. Enter it below to finish signing in. It expires in 10 minutes.", { v0: codeStep?.sentTo ?? "" })}
      </Typography>
      {message ? <Alert severity="error" sx={{ mb: 2 }}>{ct(message)}</Alert> : sentAgain ? <Alert severity="success" sx={{ mb: 2 }}>{ct("A new code is on its way.")}</Alert> : null}
      <TextField
        label={ct("Sign-in code")}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
        autoFocus
        fullWidth
        slotProps={{ htmlInput: { inputMode: "numeric", autoComplete: "one-time-code", pattern: "[0-9 ]*", maxLength: 7, spellCheck: false } }}
        sx={{ "& input": { fontSize: 22, letterSpacing: ".35em", fontVariantNumeric: "tabular-nums" } }}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />} sx={{ width: { xs: "100%", sm: "auto" } }}>
          {ct("Confirm and sign in")}
        </Button>
        <Button type="button" onClick={() => void sendAgain()} disabled={pending || wait > 0} sx={{ alignSelf: { xs: "center", sm: "auto" } }}>
          {wait > 0 ? ct.template("Send a new code in {v0} s", { v0: String(wait) }) : ct("Send a new code")}
        </Button>
      </Stack>
      <Button type="button" onClick={() => void cancelCode()} disabled={pending} sx={{ mt: 2, px: 0, minHeight: 44 }}>
        {ct("Use a different account")}
      </Button>
    </Box>
  )
}
