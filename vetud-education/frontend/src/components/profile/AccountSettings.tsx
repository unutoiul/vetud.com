"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
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

/**
 * The email the member signs in with. Members have no passwords (owner, 2026-11-19), so a new
 * address is confirmed with a code we email to it; then it's the address they sign in with.
 */
export function EmailForm() {
  const ct = useContentTranslator()
  const { customer, refreshCustomer } = useAccount()
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<Status>(null)

  const sendCode = async () => {
    setStatus(null)
    const next = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(next)) {
      setStatus({ kind: "error", text: "Please enter a valid email address." })
      return
    }
    setSaving(true)
    try {
      await sdk.client.fetch("/store/account/email/code", { method: "POST", body: { email: next } })
      setSentTo(next)
      setCode("")
    } catch (error) {
      setStatus({ kind: "error", text: forumError(error, "We couldn't send the code. Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  const confirm = async () => {
    setStatus(null)
    if (!sentTo) return
    if (!/^\d{6}$/.test(code.replace(/\D/g, ""))) {
      setStatus({ kind: "error", text: "Enter the 6-digit code from the email." })
      return
    }
    setSaving(true)
    try {
      await sdk.client.fetch<{ email: string }>("/store/account/email", { method: "POST", body: { email: sentTo, code: code.replace(/\D/g, "") } })
      await refreshCustomer()
      setEmail("")
      setSentTo(null)
      setCode("")
      setStatus({ kind: "success", text: ct.template("Done. Sign in with {v0} from now on.", { v0: sentTo }, { translateValues: false }) })
    } catch (error) {
      setStatus({ kind: "error", text: forumError(error, "We couldn't change your email. Please try again.") })
    } finally {
      setSaving(false)
    }
  }

  const startOver = () => {
    setSentTo(null)
    setCode("")
    setStatus(null)
  }

  return (
    <SettingsCard
      title="Sign-in email"
      description={ct.template("You sign in with {v0}. It's private and never shown to other members.", { v0: customer?.email ?? "" }, { translateValues: false })}
      onSubmit={sentTo ? confirm : sendCode}
      saving={saving}
      status={status}
      submitLabel={sentTo ? "Change email" : "Email me a code"}
    >
      {sentTo ? (
        <Stack spacing={2}>
          <Alert severity="info" role="status">
            {ct("We sent a 6-digit code to")} <Box component="strong" sx={{ fontWeight: 650, overflowWrap: "anywhere" }}>{sentTo}</Box>. {ct("Enter it to confirm the new address.")}
          </Alert>
          <TextField
            label={ct("Code from the email")}
            required
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^\d ]/g, "").slice(0, 7))}
            slotProps={{ htmlInput: { autoComplete: "one-time-code", inputMode: "numeric", maxLength: 7, sx: { letterSpacing: "0.3em", fontVariantNumeric: "tabular-nums", fontSize: 20 } } }}
          />
          <Box><Button type="button" onClick={startOver} sx={{ minHeight: 44 }}>{ct("Use a different email")}</Button></Box>
        </Stack>
      ) : (
        <TextField
          label={ct("New email")}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          helperText={ct("We'll email a code to the new address to make sure it's yours.")}
          slotProps={{ htmlInput: { autoComplete: "email", spellCheck: false, inputMode: "email" } }}
        />
      )}
    </SettingsCard>
  )
}
