"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import IconButton from "@mui/material/IconButton"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useTranslations } from "next-intl"
import { useState, type FormEvent, type ReactNode } from "react"
import { useContentTranslator } from "@/i18n/use-content-translator"
import type { OwnForumProfile } from "@/lib/community/types"
import { sdk } from "@/lib/medusa/sdk"
import Icon from "../brand/Icon"
import { useAccount } from "../account/AccountProvider"
import { forumError } from "../community/useCommunityProfile"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Status = { kind: "success" | "error"; text: string } | null

/** A password input with a show/hide button. */
function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: "current-password" | "new-password" }) {
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
      slotProps={{
        htmlInput: { autoComplete, spellCheck: false, autoCapitalize: "none" },
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

/** A titled settings card with its own form, save button and result message. */
function SettingsCard({ title, description, children, onSubmit, saving, status, submitLabel }: {
  title: string
  description: string
  children: ReactNode
  onSubmit: () => Promise<void>
  saving: boolean
  status: Status
  submitLabel: string
}) {
  const ct = useContentTranslator()
  const submit = (event: FormEvent) => {
    event.preventDefault()
    void onSubmit()
  }
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
      <Typography component="h3" sx={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em" }}>{ct(title)}</Typography>
      <Typography sx={{ mt: .5, mb: 2.5, fontSize: 14, color: "text.secondary", maxWidth: 560 }}>{ct(description)}</Typography>
      <Box component="form" noValidate onSubmit={submit}>
        {children}
        {status ? <Alert severity={status.kind} role={status.kind === "success" ? "status" : "alert"} sx={{ mt: 2 }}>{ct(status.text)}</Alert> : null}
        <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Icon name="check" sx={{ fontSize: 17 }} />} sx={{ mt: 2.5 }}>
          {ct(submitLabel)}
        </Button>
      </Box>
    </Paper>
  )
}

/** Community name and bio, shown on every post and the public member page. */
export function CommunityProfileForm({ profile, onSaved }: { profile: OwnForumProfile; onSaved: (profile: OwnForumProfile) => void }) {
  const ct = useContentTranslator()
  const [name, setName] = useState(profile.display_name)
  const [bio, setBio] = useState(profile.bio ?? "")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const save = async () => {
    setStatus(null)
    const trimmed = name.trim()
    if (trimmed.length < 3 || trimmed.length > 32) {
      setStatus({ kind: "error", text: "Your community name needs 3 to 32 characters." })
      return
    }
    setSaving(true)
    try {
      const { profile: saved } = await sdk.client.fetch<{ profile: OwnForumProfile }>("/store/forum/me", {
        method: "POST",
        body: { display_name: trimmed, bio: bio.trim() || null, accept_guidelines: true },
      })
      onSaved(saved)
      setStatus({ kind: "success", text: "Your community profile is saved." })
    } catch (error) {
      setStatus({ kind: "error", text: forumError(error, "We couldn't save your profile. Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard title="Community profile" description="Your community name and bio are public. They appear on your posts and your member page. Your real name and email are never shown." onSubmit={save} saving={saving} status={status} submitLabel="Save profile">
      <Stack spacing={2}>
        <TextField label={ct("Community name")} value={name} onChange={(event) => setName(event.target.value)} required helperText={ct("3 to 32 characters. Changing it also changes your member page address.")} slotProps={{ htmlInput: { maxLength: 32, autoComplete: "nickname" } }} />
        <TextField label={ct("Bio")} value={bio} onChange={(event) => setBio(event.target.value)} multiline minRows={3} helperText={ct.template("{v0}/500. What you research or want to learn about. No doses or personal medical details.", { v0: bio.length })} slotProps={{ htmlInput: { maxLength: 500 } }} />
      </Stack>
    </SettingsCard>
  )
}

/** First and last name, private to the member. */
export function PersonalDetailsForm() {
  const ta = useTranslations("Address")
  const { customer, refreshCustomer } = useAccount()
  const [firstName, setFirstName] = useState(customer?.first_name ?? "")
  const [lastName, setLastName] = useState(customer?.last_name ?? "")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const save = async () => {
    setStatus(null)
    if (!firstName.trim() || !lastName.trim()) {
      setStatus({ kind: "error", text: "Please enter your first and last name." })
      return
    }
    setSaving(true)
    try {
      await sdk.store.customer.update({ first_name: firstName.trim(), last_name: lastName.trim() })
      await refreshCustomer()
      setStatus({ kind: "success", text: "Your name is saved." })
    } catch (error) {
      setStatus({ kind: "error", text: forumError(error, "We couldn't save your name. Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard title="Personal details" description="Your real name is private. We use it only in emails to you." onSubmit={save} saving={saving} status={status} submitLabel="Save name">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("firstName")} value={firstName} onChange={(event) => setFirstName(event.target.value)} required slotProps={{ htmlInput: { autoComplete: "given-name" } }} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label={ta("lastName")} value={lastName} onChange={(event) => setLastName(event.target.value)} required slotProps={{ htmlInput: { autoComplete: "family-name" } }} /></Grid>
      </Grid>
    </SettingsCard>
  )
}

/** The email the member signs in with; changing it needs the password. */
export function EmailForm() {
  const ct = useContentTranslator()
  const { customer, refreshCustomer } = useAccount()
  const [email, setEmail] = useState("")
  const [confirm, setConfirm] = useState("")
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const save = async () => {
    setStatus(null)
    const next = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(next)) {
      setStatus({ kind: "error", text: "Please enter a valid email address." })
      return
    }
    if (next !== confirm.trim().toLowerCase()) {
      setStatus({ kind: "error", text: "The two email addresses don't match." })
      return
    }
    if (!password) {
      setStatus({ kind: "error", text: "Enter your current password to confirm it's you." })
      return
    }
    setSaving(true)
    try {
      await sdk.client.fetch<{ email: string }>("/store/account/email", { method: "POST", body: { email: next, password } })
      await refreshCustomer()
      setEmail("")
      setConfirm("")
      setPassword("")
      setStatus({ kind: "success", text: ct.template("Done. Sign in with {v0} from now on.", { v0: next }, { translateValues: false }) })
    } catch (error) {
      setStatus({ kind: "error", text: forumError(error, "We couldn't change your email. Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard title="Sign-in email" description={ct.template("You sign in with {v0}. It's private and never shown to other members.", { v0: customer?.email ?? "" }, { translateValues: false })} onSubmit={save} saving={saving} status={status} submitLabel="Change email">
      <Stack spacing={2}>
        <TextField label={ct("New email")} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false } }} />
        <TextField label={ct("Repeat the new email")} type="email" value={confirm} onChange={(event) => setConfirm(event.target.value)} required slotProps={{ htmlInput: { autoComplete: "off", spellCheck: false } }} />
        <PasswordField label="Current password" value={password} onChange={setPassword} autoComplete="current-password" />
      </Stack>
    </SettingsCard>
  )
}

/** A new password, after the current one. */
export function PasswordForm() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [repeat, setRepeat] = useState("")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const save = async () => {
    setStatus(null)
    if (next.length < 8) {
      setStatus({ kind: "error", text: "Your new password needs at least 8 characters." })
      return
    }
    if (next !== repeat) {
      setStatus({ kind: "error", text: "The two new passwords don't match." })
      return
    }
    setSaving(true)
    try {
      await sdk.client.fetch("/store/account/password", { method: "POST", body: { current_password: current, new_password: next } })
      setCurrent("")
      setNext("")
      setRepeat("")
      setStatus({ kind: "success", text: "Your password is changed." })
    } catch (error) {
      setStatus({ kind: "error", text: forumError(error, "We couldn't change your password. Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsCard title="Password" description="Use at least 8 characters. A longer phrase is easier to remember and harder to guess." onSubmit={save} saving={saving} status={status} submitLabel="Change password">
      <Stack spacing={2}>
        <PasswordField label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
        <PasswordField label="New password" value={next} onChange={setNext} autoComplete="new-password" />
        <PasswordField label="Repeat the new password" value={repeat} onChange={setRepeat} autoComplete="new-password" />
      </Stack>
    </SettingsCard>
  )
}
