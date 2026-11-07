"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"

import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"


import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import FormControlLabel from "@mui/material/FormControlLabel"
import FormHelperText from "@mui/material/FormHelperText"
import Grid from "@mui/material/Grid"
import MenuItem from "@mui/material/MenuItem"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useEffect, useRef, useState } from "react"
import { AppLink, ButtonLink } from "@/components/common/links"
import { sdk } from "@/lib/medusa/sdk"

const EMPTY = { name: "", email: "", role: "", organization: "", expertise: "", credentials: "", background: "", contribution: "", website: "" }
const ROLES = ["Doctor / clinician", "Researcher / scientist", "Academic / educator", "Other relevant professional"]
type Field = keyof typeof EMPTY

function isPublicWebUrl(value: string) {
  try {
    const url = new URL(value)
    return ["https:", "http:"].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password
  } catch { return false }
}

export default function ExpertApplicationForm() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const [values, setValues] = useState(EMPTY)
  const [agreed, setAgreed] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const confirmation = useRef<HTMLDivElement>(null)

  useEffect(() => { if (sent) confirmation.current?.focus() }, [sent])

  const errors: Partial<Record<Field | "agreement", string>> = {
    name: values.name.trim() ? undefined : "Enter your full name.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? undefined : "Enter a valid email address.",
    role: ROLES.includes(values.role) ? undefined : "Choose the role that best describes your work.",
    expertise: values.expertise.trim() ? undefined : "Add your main areas of expertise.",
    credentials: isPublicWebUrl(values.credentials.trim()) ? undefined : "Enter a full public link starting with https:// or http://.",
    background: values.background.trim().length >= 30 ? undefined : "Tell us a little more about your background (at least 30 characters).",
    agreement: agreed ? undefined : "Confirm that your details are accurate and you agree to the guidelines.",
  }

  const bind = (name: Field, maxLength: number, helperText?: string, autoComplete = "off") => ({
    id: `expert-${name}`,
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues(previous => ({ ...previous, [name]: event.target.value })),
    error: showErrors && Boolean(errors[name]),
    helperText: (showErrors && errors[name]) || helperText,
    slotProps: { htmlInput: { maxLength, autoComplete } },
  })

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    setShowErrors(true)
    const invalid = Object.keys(errors).find(key => errors[key as keyof typeof errors])
    if (invalid) {
      const selector = invalid === "role" ? "#expert-role" : `[name="${invalid}"]`
      event.currentTarget.querySelector<HTMLElement>(selector)?.focus()
      return
    }
    submitting.current = true
    setSending(true)
    setError(null)
    try {
      // Keep the structured application within the existing contact service's 5,000-character limit.
      await sdk.client.fetch("/store/contact", {
        method: "POST",
        body: {
          name: values.name.trim(), email: values.email.trim(),
          subject: "Verified expert application",
          message: [
            `Role: ${values.role}`,
            `Organization: ${values.organization.trim() || "Not provided"}`,
            `Areas of expertise: ${values.expertise.trim()}`,
            `Public credential link: ${values.credentials.trim()}`,
            `Professional background:\n${values.background.trim()}`,
            `How I would like to contribute:\n${values.contribution.trim() || "Not provided"}`,
            "Applicant confirmed their details are accurate and agreed to the community guidelines.",
          ].join("\n\n"),
          ...(values.website ? { website: values.website } : {}),
        },
      })
      setSent(true)
      setValues(EMPTY)
    } catch {
      setError("Your application could not be sent. Your details are still here; please try again, or contact the team for help.")
    } finally {
      submitting.current = false
      setSending(false)
    }
  }

  if (sent) return <Box ref={confirmation} tabIndex={-1} role="status" sx={{ p: { xs: 3, sm: 4 }, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: 3, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 4 } }}>
    <Typography component="h3" variant="h5" sx={{ mb: 1 }}>{ct("Application sent")}</Typography>
    <Typography sx={{ color: "text.secondary", mb: 3 }}>{ct("Thank you for sharing your expertise. The Vetud team will review your application and follow up at the email address you provided. Your badge will appear only after approval.")}</Typography>
    <ButtonLink href="/community" variant="contained">{act("backCommunity")}</ButtonLink>
  </Box>

  return <Box component="form" noValidate onSubmit={submit} aria-label={act("expertApplication")} aria-busy={sending}>
    {error ? <Alert severity="error" sx={{ mb: 3 }}>{ct(error)} <AppLink href="/contact">{act("contact")}</AppLink>.</Alert> : null}
    <Box component="fieldset" disabled={sending} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Typography component="legend" sx={{ fontSize: 19, fontWeight: 650, mb: 2.5 }}>{ct("Your details")}</Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label={act("fullName")} required {...bind("name", 120, undefined, "name")} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label={act("email")} type="email" required {...bind("email", 254, "We’ll use this to follow up on your application.", "email")} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label={act("professionalRole")} select required {...bind("role", 80)}><MenuItem value="" disabled>{act("selectRole")}</MenuItem>{ROLES.map(role => <MenuItem key={role} value={role}>{translateAction(act, role)}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><TextField label={act("organizationOptional")} {...bind("organization", 160, undefined, "organization")} /></Grid>
      </Grid>
    </Box>
    <Box component="fieldset" disabled={sending} sx={{ border: 0, borderTop: "1px solid", borderColor: "divider", p: 0, pt: 3.5, mt: 4, mx: 0, minWidth: 0 }}>
      <Typography component="legend" sx={{ fontSize: 19, fontWeight: 650, pr: 2 }}>{ct("Expertise & credentials")}</Typography>
      <Grid container spacing={2.5}>
        <Grid size={12}><TextField label={act("expertise")} required {...bind("expertise", 240, "For example: endocrinology, molecular biology, or clinical research.")} /></Grid>
        <Grid size={12}><TextField label={act("credentials")} type="url" required {...bind("credentials", 700, "Link an institutional profile, professional register, ORCID record, or published work.")} /></Grid>
        <Grid size={12}><TextField label={act("background")} required multiline minRows={4} {...bind("background", 1600, "Describe your qualifications and relevant research or professional experience. Up to 1,600 characters.")} /></Grid>
        <Grid size={12}><TextField label={act("contribute")} multiline minRows={3} {...bind("contribution", 1000, "Share the topics you’d like to discuss and any relevant affiliations or interests.")} /></Grid>
      </Grid>
    </Box>
    <Box aria-hidden sx={{ position: "absolute", left: -10000, width: 1, height: 1, overflow: "hidden" }}>
      <label>{ct("Website")}<input name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={event => setValues(previous => ({ ...previous, website: event.target.value }))} /></label>
    </Box>
    <Box sx={{ mt: 3 }}>
      <FormControlLabel sx={{ alignItems: "flex-start", ml: -1.25, mr: 0, "& .MuiFormControlLabel-label": { pt: 1, fontSize: 14, lineHeight: 1.65 } }} control={<Checkbox name="agreement" checked={agreed} disabled={sending} required onChange={event => setAgreed(event.target.checked)} slotProps={{ input: { "aria-describedby": showErrors && errors.agreement ? "expert-agreement-error" : undefined, "aria-invalid": showErrors && Boolean(errors.agreement) } }} />} label={<>{act.rich("expertAgreement", { link: chunks => <AppLink href="/community/guidelines" target="_blank" rel="noopener noreferrer">{ct(chunks)}</AppLink> })} *</>} />
      {showErrors && errors.agreement ? <FormHelperText error id="expert-agreement-error">{ct(errors.agreement)}</FormHelperText> : null}
    </Box>
    <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>{ct.rich("We use these details to review your application and contact you. Read our <slot0>{v0}</slot0>.", { v0: act("privacyNewTab") }, { slot0: chunks => <AppLink href="/legal/privacy" target="_blank" rel="noopener noreferrer" key="slot0">{chunks}</AppLink> })}</Typography>
    <Button type="submit" variant="contained" size="large" disabled={sending} startIcon={sending ? <CircularProgress size={16} color="inherit" /> : undefined} sx={{ mt: 3, width: { xs: "100%", sm: "auto" } }}>{ct(sending ? act("sendingApplication") : act("sendApplication"))}</Button>
  </Box>
}
