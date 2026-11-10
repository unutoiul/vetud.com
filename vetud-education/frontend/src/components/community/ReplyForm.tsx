"use client"
import { useContentTranslator } from "@/i18n/use-content-translator"


import { useTranslations } from "next-intl"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import TextField from "@mui/material/TextField"
import { useState, type FormEvent } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { findDose } from "@/lib/community/format"
import type { ForumImage, ForumPost, OwnForumProfile } from "@/lib/community/types"
import ImagePicker from "./ImagePicker"
import { forumError } from "./useCommunityProfile"

const MAX_LENGTH = 5000

export default function ReplyForm({ threadId, profile, question, onPosted }: { threadId: string; profile: OwnForumProfile; question: boolean; onPosted: (post: ForumPost) => void }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const [body, setBody] = useState("")
  const [images, setImages] = useState<ForumImage[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dose = findDose(body)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (body.trim().length < 2) return
    setPosting(true)
    setError(null)
    try {
      const { post } = await sdk.client.fetch<{ post: ForumPost }>(`/store/forum/threads/${encodeURIComponent(threadId)}/posts`, { method: "POST", body: { body: body.trim(), images: images.map(image => image.id) } })
      onPosted(post)
      setBody("")
      setImages([])
    } catch (caught) {
      setError(forumError(caught, "We couldn't post your reply. Please try again."))
    } finally {
      setPosting(false)
    }
  }

  return <Box component="form" noValidate onSubmit={submit} aria-busy={posting}>
    <TextField label={act(question ? "answerAs" : "replyAs", { name: profile.display_name })} value={body} multiline minRows={4} fullWidth
      onChange={event => { setBody(event.target.value.slice(0, MAX_LENGTH)); if (error) setError(null) }}
      helperText={ct.template("{v0}/{v1} · Share what you observed or what the research says. Please don't share doses or personal medical advice.", { v0: body.length, v1: MAX_LENGTH })}
      slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }} />
    <Box sx={{ mt: 2 }}><ImagePicker images={images} onChange={setImages} disabled={posting} /></Box>
    {dose ? <Alert severity="warning" sx={{ mt: 1.5 }}>“{ct(dose)}{ct("” looks like a dose amount. The community doesn't share doses, so a reply with one waits for a moderator. Remove it to publish straight away.")}</Alert> : null}
    {error ? <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>{ct(error)}</Alert> : null}
    <Button type="submit" variant="contained" disabled={posting || body.trim().length < 2} startIcon={posting ? <CircularProgress size={16} color="inherit" /> : null} sx={{ mt: 2 }}>
      {ct(posting ? act("posting") : question ? act("postAnswer") : act("postReply"))}
    </Button>
  </Box>
}
