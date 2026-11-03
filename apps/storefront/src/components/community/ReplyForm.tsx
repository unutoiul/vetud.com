"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import TextField from "@mui/material/TextField"
import { useState, type FormEvent } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { findDose } from "@/lib/community/format"
import type { ForumPost, OwnForumProfile } from "@/lib/community/types"
import { forumError } from "./useCommunityProfile"

const MAX_LENGTH = 5000

export default function ReplyForm({ threadId, profile, question, onPosted }: { threadId: string; profile: OwnForumProfile; question: boolean; onPosted: (post: ForumPost) => void }) {
  const [body, setBody] = useState("")
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dose = findDose(body)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (body.trim().length < 2) return
    setPosting(true)
    setError(null)
    try {
      const { post } = await sdk.client.fetch<{ post: ForumPost }>(`/store/forum/threads/${encodeURIComponent(threadId)}/posts`, { method: "POST", body: { body: body.trim() } })
      onPosted(post)
      setBody("")
    } catch (caught) {
      setError(forumError(caught, "We couldn't post your reply. Please try again."))
    } finally {
      setPosting(false)
    }
  }

  return <Box component="form" noValidate onSubmit={submit} aria-busy={posting}>
    <TextField label={`${question ? "Answer" : "Reply"} as ${profile.display_name}`} value={body} multiline minRows={4} fullWidth
      onChange={event => { setBody(event.target.value.slice(0, MAX_LENGTH)); if (error) setError(null) }}
      helperText={`${body.length}/${MAX_LENGTH} · Share what you observed or what the research says. Please don't share doses or personal medical advice.`}
      slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }} />
    {dose ? <Alert severity="warning" sx={{ mt: 1.5 }}>“{dose}” looks like a dose amount. The community doesn&apos;t share doses, so a reply with one waits for a moderator. Remove it to publish straight away.</Alert> : null}
    {error ? <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>{error}</Alert> : null}
    <Button type="submit" variant="contained" disabled={posting || body.trim().length < 2} startIcon={posting ? <CircularProgress size={16} color="inherit" /> : null} sx={{ mt: 2 }}>
      {posting ? "Posting…" : question ? "Post answer" : "Post reply"}
    </Button>
  </Box>
}
