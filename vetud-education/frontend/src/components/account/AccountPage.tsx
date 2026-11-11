"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import Icon from "../brand/Icon"
import { useLanguage } from "../common/language"
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

export function PasswordField({ label, value, onChange, autoComplete, helperText, error }: {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: "current-password" | "new-password"
  helperText?: string
  error?: boolean
}) {
  const ct = useContentTranslator()
  const t = useTranslations("Account")
  const [visible, setVisible] = useState(false)
  return (
    <TextField
      label={ct(label)}
      type={visible ? "text" : "password"}
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      helperText={ct(helperText)}
      error={error}
      slotProps={{
        htmlInput: { autoComplete, minLength: 8, spellCheck: false, autoCapitalize: "none" },
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={t("showPassword")} aria-pressed={visible} onClick={() => setVisible(!visible)} edge="end">
                <Icon name={visible ? "eyeOff" : "eye"} sx={{ fontSize: 20 }} />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

/** Emails a one-time reset link. Medusa replies the same way whether or not the account exists. */
export function ResetRequestForm({ initialEmail = "", onBack }: { initialEmail?: string; onBack?: () => void }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const language = useLanguage()
  const { requestPasswordReset, pending } = useAccount()
  const [email, setEmail] = useState(initialEmail)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    const trimmed = email.trim()
    if (!EMAIL_PATTERN.test(trimmed)) {
      setFormError(t("invalidEmail"))
      return
    }
    try {
      await requestPasswordReset(trimmed, language)
      setSentTo(trimmed)
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  return (
    <Box component="form" onSubmit={submit} noValidate>
      {sentTo ? <Alert severity="success" role="status" sx={{ mb: 2 }}>{t("resetSent", { email: sentTo })}</Alert> : null}
      {formError ? <Alert severity="error" sx={{ mb: 2 }}>{ct(formError)}</Alert> : null}
      <TextField label={act("email")} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3, alignItems: { sm: "center" } }}>
        <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="mail" sx={{ fontSize: 17 }} />}>
          {sentTo ? t("resendLink") : t("sendLink")}
        </Button>
        {onBack ? <Button type="button" onClick={onBack}>{t("backToSignin")}</Button> : null}
      </Stack>
    </Box>
  )
}

export function AuthPanel() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const t = useTranslations("Account")
  const ta = useTranslations("Address")
  const { signIn, signUp, pending, error, clearError } = useAccount()
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const switchMode = (next: typeof mode) => {
    setMode(next)
    setFormError(null)
    clearError()
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)
    clearError()
    if (!EMAIL_PATTERN.test(email.trim())) {
      setFormError(t("invalidEmail"))
      return
    }
    if (password.length < 8) {
      setFormError(t("invalidPassword"))
      return
    }
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) {
      setFormError(t("invalidName"))
      return
    }
    try {
      if (mode === "signin") await signIn(email.trim(), password)
      else await signUp({ email: email.trim(), password, first_name: firstName.trim(), last_name: lastName.trim() })
    } catch (caught) {
      setFormError(errorText(caught))
    }
  }

  return (
    <Grid container spacing={{ xs: 3, md: 6 }}>
      <Grid size={{ xs: 12, md: 5 }}>
        <Typography variant="eyebrow" sx={{ color: "secondary.main" }}>
          {mode === "signin" ? t("welcome") : t("account")}
        </Typography>
        <Typography variant="h3" component="h2" sx={{ mt: 1.5, mb: 2 }}>
          {mode === "reset" ? t("resetTitle") : ct(mode === "signin" ? "Sign in to join the conversation." : "Join the VETUD community.")}
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>
          {mode === "reset" ? t("resetIntro") : ct("An account lets you ask questions in the community, answer other members and comment on articles.")}
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
          {mode === "reset" ? <ResetRequestForm initialEmail={email} onBack={() => switchMode("signin")} /> : <>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Button variant={mode === "signin" ? "contained" : "text"} aria-pressed={mode === "signin"} onClick={() => switchMode("signin")}>{t("signin")}</Button>
              <Button variant={mode === "signup" ? "contained" : "text"} aria-pressed={mode === "signup"} onClick={() => switchMode("signup")}>{t("signup")}</Button>
            </Stack>
            {formError || error ? <Alert severity="error" sx={{ mb: 2 }}>{ct(formError || error)}</Alert> : null}
            <Box component="form" onSubmit={submit} noValidate>
              {mode === "signup" ? (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("firstName")} required value={firstName} onChange={(event) => setFirstName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "given-name" } }} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("lastName")} required value={lastName} onChange={(event) => setLastName(event.target.value)} slotProps={{ htmlInput: { autoComplete: "family-name" } }} /></Grid>
                </Grid>
              ) : null}
              <Stack spacing={2}>
                <TextField label={act("email")} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
                <PasswordField label={t("password")} value={password} onChange={setPassword} helperText={mode === "signup" ? t("passwordHelp") : undefined} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                <Button type="submit" variant="contained" size="large" disabled={pending} startIcon={pending ? <CircularProgress size={16} color="inherit" /> : <Icon name="lock" sx={{ fontSize: 17 }} />} sx={{ width: { xs: "100%", sm: "auto" } }}>
                  {mode === "signin" ? t("signin") : t("signup")}
                </Button>
                {mode === "signin" ? <Button type="button" onClick={() => switchMode("reset")} sx={{ alignSelf: { xs: "center", sm: "auto" } }}>{t("forgot")}</Button> : null}
              </Stack>
            </Box>
          </>}
        </Paper>
      </Grid>
    </Grid>
  )
}
