"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import { useTranslations } from "next-intl"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Checkbox from "@mui/material/Checkbox"
import CircularProgress from "@mui/material/CircularProgress"
import FormControlLabel from "@mui/material/FormControlLabel"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useState, type FormEvent } from "react"
import { sdk } from "@/lib/medusa/sdk"
import type { OwnForumProfile } from "@/lib/community/types"
import { GUIDELINE_SUMMARY } from "@/lib/community/format"
import { AppLink } from "../common/links"
import { forumError } from "./useCommunityProfile"

/** First visit: choose a public community name and accept the guidelines. */
export default function JoinCommunity({ suggested, onJoined }: { suggested: string; onJoined: (profile: OwnForumProfile) => void }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const [name, setName] = useState(suggested)
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!agreed) {
      setError("Please accept the community guidelines first.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const { profile } = await sdk.client.fetch<{ profile: OwnForumProfile }>("/store/forum/me", {
        method: "POST",
        body: { display_name: name.trim(), accept_guidelines: true },
      })
      onJoined(profile)
    } catch (caught) {
      setError(forumError(caught, "We couldn't create your community profile. Please try again."))
    } finally {
      setSaving(false)
    }
  }

  return <Box component="form" noValidate onSubmit={submit} sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "divider", borderRadius: "10px" }}>
    <Typography component="h2" sx={{ fontSize: 20, fontWeight: 650, color: "brand.navy" }}>{act("joinCommunity")}</Typography>
    <Typography sx={{ mt: .75, fontSize: 15, color: "brand.navySoft", lineHeight: 1.7 }}>{ct("Choose the name other members will see. It doesn't have to be your real name, and you can change it later.")}</Typography>
    <TextField label={act("communityName")} value={name} onChange={event => setName(event.target.value.slice(0, 32))} required fullWidth sx={{ mt: 2.5, maxWidth: 420, bgcolor: "#fff" }}
      helperText={ct("3 to 32 characters: letters, numbers, spaces, dots or dashes.")} slotProps={{ htmlInput: { maxLength: 32, autoComplete: "nickname" } }} />
    <Box component="ul" sx={{ mt: 2.5, mb: 1, pl: 2.5, display: "grid", gap: .75, fontSize: 14.5, lineHeight: 1.6, color: "brand.ink" }}>
      {GUIDELINE_SUMMARY.map(line => <li key={line}>{ct(line)}</li>)}
    </Box>
    <FormControlLabel control={<Checkbox checked={agreed} onChange={event => setAgreed(event.target.checked)} />}
      label={<Typography sx={{ fontSize: 14.5 }}>{act.rich("guidelineAgreement", { link: chunks => <AppLink href="/community/guidelines" target="_blank">{ct(chunks)}</AppLink> })}</Typography>} />
    {error ? <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>{ct(error)}</Alert> : null}
    <Box sx={{ mt: 2 }}>
      <Button type="submit" variant="contained" disabled={saving || name.trim().length < 3} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
        {ct(saving ? act("joining") : act("joinCommunity"))}
      </Button>
    </Box>
  </Box>
}
