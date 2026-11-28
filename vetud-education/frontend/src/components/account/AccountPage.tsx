"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Icon from "../brand/Icon"
import AccountDashboard from "../profile/AccountDashboard"
import { useAccount } from "./AccountProvider"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function errorText(error: unknown) {
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message)
  return "Something went wrong. Please try again."
}

export default function AccountPage() {
  const { customer, loading } = useAccount()
  if (loading) return <Skeleton variant="rounded" height={480} />
  return customer ? <AccountDashboard /> : <AuthPanel />
}

/** The address a code was just sent to, kept for this tab: going to the mail app and back may reload it. */
const PENDING_KEY = "vetud_sign_in_email"

function readPendingEmail() {
  try {
    return window.sessionStorage.getItem(PENDING_KEY)
  } catch {
    return null
  }
}

function writePendingEmail(email: string | null) {
  try {
    if (email) window.sessionStorage.setItem(PENDING_KEY, email)
    else window.sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // Without storage the code step still works until the page is reloaded.
  }
}

/**
 * Sign in, or join, with a 6-digit code emailed to you: there are no passwords (owner, 2026-11-19).
 * A sign-in lasts 30 days.
 */
export function AuthPanel() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const { requestCode, verifyCode, pending, error, clearError } = useAccount()
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [wait, setWait] = useState(0)
  const [fresh, setFresh] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  // Back from the mail app: the code step is still open.
  useEffect(() => {
    const saved = readPendingEmail()
    if (!saved) return
    const timer = window.setTimeout(() => {
      setSentTo(saved)
      setEmail(saved)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  // Counts down to when another code can be sent.
  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  const send = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setFormError(null)
    clearError()
    const address = (sentTo ?? email).trim()
    if (!EMAIL_PATTERN.test(address)) {
      setFormError(t("invalidEmail"))
      return
    }
    try {
      const { sent, resendAfter } = await requestCode(address)
      setFresh(sent)
      setSentTo(address)
      writePendingEmail(address)
      setCode("")
      setWait(resendAfter)
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  const verify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    clearError()
    if (!sentTo) return
    if (!/^\d{6}$/.test(code.replace(/\D/g, ""))) {
      setFormError(ct("Enter the 6-digit code from the email."))
      return
    }
    try {
      await verifyCode(sentTo, code)
      writePendingEmail(null)
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  const changeEmail = () => {
    setSentTo(null)
    writePendingEmail(null)
    setCode("")
    setFormError(null)
    clearError()
  }

  const message = formError || error
  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          {t("welcome")}
        </Typography>
        <Typography variant="h3" component="h2" sx={{ mt: 1.5, mb: 2 }}>
          {sentTo ? ct("Check your email.") : ct("Sign in to join the conversation.")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {ct(
            "An account lets you ask questions in the community, answer other members and comment on articles. No password needed: we email you a code.",
          )}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
          {sentTo === null ? (
            <Box component="form" onSubmit={send} noValidate>
              {message ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {ct(message)}
                </Alert>
              ) : null}
              <TextField
                label={act("email")}
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                helperText={ct("We'll email you a 6-digit code. If you're new, it creates your account.")}
                slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false, inputMode: "email" } }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={pending}
                startIcon={
                  pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="mail" sx={{ fontSize: 17 }} />
                }
                sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}
              >
                {ct("Email me a sign-in code")}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={verify} noValidate>
              <Alert severity="info" role="status" sx={{ mb: 2 }}>
                {ct(fresh ? "We sent a 6-digit code to" : "We sent a code a moment ago to")}{" "}
                <Box component="strong" sx={{ fontWeight: 650, overflowWrap: "anywhere" }}>
                  {sentTo}
                </Box>
                .{" "}
                {ct(
                  fresh
                    ? "It works for 10 minutes. Check your spam folder if you can't see it."
                    : "Use that one, or ask for a new code when the timer ends.",
                )}
              </Alert>
              {message ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {ct(message)}
                </Alert>
              ) : null}
              <TextField
                label={ct("Sign-in code")}
                required
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
                slotProps={{
                  htmlInput: {
                    autoComplete: "one-time-code",
                    inputMode: "numeric",
                    maxLength: 7,
                    sx: { letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums", fontSize: 20 },
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={pending}
                startIcon={
                  pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />
                }
                sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}
              >
                {t("signin")}
              </Button>
              <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                <Button type="button" disabled={pending || wait > 0} onClick={() => void send()} sx={{ minHeight: 44 }}>
                  {wait > 0 ? ct.template("Send a new code in {v0} s", { v0: wait }) : ct("Send a new code")}
                </Button>
                <Button type="button" onClick={changeEmail} sx={{ minHeight: 44 }}>
                  {ct("Use a different email")}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>
  )
}
