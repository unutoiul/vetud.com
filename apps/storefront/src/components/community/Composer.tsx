"use client"

import Alert from "@mui/material/Alert"
import Autocomplete from "@mui/material/Autocomplete"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Skeleton from "@mui/material/Skeleton"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useRouter, useSearchParams } from "next/navigation"
import Icon from "../brand/Icon"
import { useState, type FormEvent } from "react"
import { getPeptide, PEPTIDES } from "@/content/learn/peptides"
import { revalidateCommunity } from "@/lib/community/actions"
import { findDose, KIND_LABELS, THREAD_KINDS } from "@/lib/community/format"
import { COMMUNITY_TOPICS, getTopic, topicForPeptide, type TopicId } from "@/lib/community/topics"
import type { ForumImage, ForumThreadDetail, ThreadKind } from "@/lib/community/types"
import { sdk } from "@/lib/medusa/sdk"
import { AuthPanel } from "../account/AccountPage"
import { useLocalizedHref } from "../common/links"
import ImagePicker from "./ImagePicker"
import JoinCommunity from "./JoinCommunity"
import { forumError, useCommunityProfile } from "./useCommunityProfile"

const HINTS: Record<ThreadKind, string> = {
  question: "Ask the community and experts. You can mark the best answer.",
  discussion: "Talk about a study, storage or anything else.",
}

const PEPTIDE_OPTIONS = [...PEPTIDES].sort((a, b) => a.name.localeCompare(b.name))

/** Start a question or discussion. Signs the member in and creates their profile first if needed. */
export default function Composer() {
  const router = useRouter()
  const params = useSearchParams()
  const localize = useLocalizedHref()
  const community = useCommunityProfile()

  const initialKind = THREAD_KINDS.find(kind => kind === params.get("kind")) ?? "question"
  const initialPeptide = getPeptide(params.get("peptide") ?? "")?.slug ?? null
  const chosenTopic = getTopic(params.get("topic"))?.id
  const [kind, setKind] = useState<ThreadKind>(initialKind)
  // A topic from the link, else the peptide's, until the member picks one themselves.
  const [topic, setTopic] = useState<TopicId>(chosenTopic ?? topicForPeptide(initialPeptide))
  const [topicPicked, setTopicPicked] = useState(Boolean(chosenTopic))
  const [title, setTitle] = useState((params.get("title") ?? "").slice(0, 140))
  const [body, setBody] = useState("")
  const [peptide, setPeptide] = useState<string | null>(initialPeptide)
  const [images, setImages] = useState<ForumImage[]>([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dose = findDose([title, body].join("\n"))

  if (community.loading) return <Skeleton variant="rounded" height={420} />
  if (!community.signedIn) {
    return <Box>
      <Typography sx={{ mb: 2.5, fontSize: 16, color: "brand.navySoft", lineHeight: 1.7, maxWidth: 560 }}>Sign in or create a Vetud account to post. Reading the community is open to everyone.</Typography>
      <AuthPanel />
    </Box>
  }
  if (!community.profile) return <JoinCommunity suggested={community.suggested} onJoined={community.setProfile} />
  if (community.profile.status !== "active") return <Alert severity="info">Your community account can&apos;t post right now. Contact us if you think this is a mistake.</Alert>

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setPosting(true)
    try {
      const detail = await sdk.client.fetch<ForumThreadDetail>("/store/forum/threads", {
        method: "POST",
        body: { kind, topic, title: title.trim(), body: body.trim(), peptide, images: images.map(image => image.id) },
      })
      await revalidateCommunity(detail.thread.id)
      router.push(localize(`/community/${detail.thread.id}`))
    } catch (caught) {
      setError(forumError(caught, "We couldn't post your thread. Please try again."))
      setPosting(false)
    }
  }

  return <Box component="form" noValidate onSubmit={submit} aria-busy={posting} sx={{ display: "grid", gap: 3.5 }}>
    <Box>
      <Typography component="h2" sx={{ fontSize: 15, fontWeight: 650, mb: 1.25 }}>What are you posting?</Typography>
      <Box role="radiogroup" aria-label="Thread type" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 1.5 }}>
        {THREAD_KINDS.map(option => {
          const selected = option === kind
          return <Box key={option} component="button" type="button" role="radio" aria-checked={selected} onClick={() => setKind(option)}
            sx={{ textAlign: "left", font: "inherit", cursor: "pointer", p: 2, borderRadius: "10px", border: "2px solid", borderColor: selected ? "brand.blue" : "divider", bgcolor: selected ? "brand.mintWash" : "#fff", color: "inherit", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
            <Typography sx={{ fontWeight: 700, color: "brand.navy" }}>{KIND_LABELS[option]}</Typography>
            <Typography sx={{ mt: .5, fontSize: 13.5, color: "brand.navySoft", lineHeight: 1.55 }}>{HINTS[option]}</Typography>
          </Box>
        })}
      </Box>
    </Box>

    <Autocomplete options={PEPTIDE_OPTIONS} value={PEPTIDE_OPTIONS.find(option => option.slug === peptide) ?? null}
      onChange={(_, option) => {
        setPeptide(option?.slug ?? null)
        if (!topicPicked) setTopic(topicForPeptide(option?.slug))
      }}
      getOptionLabel={option => option.name} isOptionEqualToValue={(option, value) => option.slug === value.slug}
      renderInput={inputProps => <TextField {...inputProps} label="Peptide (optional)" helperText="Helps others find your thread, and picks its topic." />} />

    <Box>
      <Typography component="h2" id="topic-label" sx={{ fontSize: 15, fontWeight: 650, mb: 1.25 }}>Topic</Typography>
      <Box role="radiogroup" aria-labelledby="topic-label" sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {COMMUNITY_TOPICS.map(option => {
          const selected = option.id === topic
          return <Box key={option.id} component="button" type="button" role="radio" aria-checked={selected} onClick={() => { setTopic(option.id); setTopicPicked(true) }}
            sx={{ display: "inline-flex", alignItems: "center", gap: .75, minHeight: 44, px: 1.75, font: "inherit", fontSize: 14, fontWeight: selected ? 650 : 500, cursor: "pointer", borderRadius: 999, border: "1px solid", borderColor: selected ? "brand.blue" : "divider", bgcolor: selected ? "brand.mintWash" : "#fff", color: selected ? "brand.navy" : "brand.navySoft", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
            <Icon name={option.icon} sx={{ fontSize: 17, color: "brand.blue" }} />{option.name}
          </Box>
        })}
      </Box>
      <Typography sx={{ mt: 1, fontSize: 13, color: "brand.navySoft" }}>{getTopic(topic)?.description}</Typography>
    </Box>

    <TextField label="Title" value={title} onChange={event => setTitle(event.target.value.slice(0, 140))} required fullWidth
      placeholder={kind === "question" ? "e.g. How do you store vials after opening?" : ""}
      helperText={`${title.length}/140`} slotProps={{ htmlInput: { maxLength: 140 } }} />

    <TextField label={kind === "question" ? "Your question" : "What would you like to discuss?"} value={body} onChange={event => setBody(event.target.value.slice(0, 10000))} required multiline minRows={6} fullWidth
      helperText="Plain text. Links from new members are checked by a moderator first." />

    <Box>
      <Typography component="h2" sx={{ fontSize: 15, fontWeight: 650, mb: 1.25 }}>Photos</Typography>
      <ImagePicker images={images} onChange={setImages} disabled={posting} />
    </Box>

    {dose ? <Alert severity="warning">“{dose}” looks like a dose amount. The community doesn&apos;t share doses or protocols, so posts with them wait for a moderator. Remove it to publish straight away.</Alert> : null}

    {error ? <Alert severity="error" onClose={() => setError(null)}>{error}</Alert> : null}

    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2 }}>
      <Button type="submit" variant="contained" size="large" disabled={posting || title.trim().length < 8 || body.trim().length < 20}
        startIcon={posting ? <CircularProgress size={16} color="inherit" /> : null}>
        {posting ? "Posting…" : `Post ${KIND_LABELS[kind].toLowerCase()}`}
      </Button>
      <Typography sx={{ fontSize: 13.5, color: "brand.navySoft" }}>Posting as {community.profile.display_name}. Titles need 8 characters and the text 20.</Typography>
    </Box>
  </Box>
}
