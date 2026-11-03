"use client"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { findDose, formatForumDate, HOLD_MESSAGES } from "@/lib/community/format"
import type { ForumPost, ForumThread } from "@/lib/community/types"
import Icon from "../brand/Icon"
import { AuthorLine, Pill } from "./Badges"
import PostBody from "./PostBody"
import PostImages from "./PostImages"
import ReportDialog from "./ReportDialog"
import { forumError } from "./useCommunityProfile"

export type PostCardProps = {
  post: ForumPost
  thread: ForumThread
  highlight?: "accepted" | "expert" | null
  canAccept?: boolean
  canInteract: boolean
  onChange: (post: ForumPost) => void
  onDeleted: (post: ForumPost) => void
  onAccept?: (postId: string | null) => Promise<void>
}

const HIGHLIGHTS = {
  accepted: { label: "Best answer", tone: "accepted", border: "#2f7a55", bg: "#f3faf6" },
  expert: { label: "Expert answer", tone: "expert", border: "#3268aa", bg: "#f3f7fc" },
} as const

/** One post with its actions: helpful vote, report, best answer, and edit or delete for the author. */
export default function PostCard({ post, thread, highlight, canAccept, canInteract, onChange, onDeleted, onAccept }: PostCardProps) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.body)
  const [reporting, setReporting] = useState(false)
  const [reported, setReported] = useState(false)
  const style = highlight ? HIGHLIGHTS[highlight] : null
  const isAccepted = thread.accepted_post_id === post.id
  const dose = editing ? findDose(draft) : null

  const run = async (label: string, action: () => Promise<void>, fallback: string) => {
    setBusy(label)
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(forumError(caught, fallback))
    } finally {
      setBusy(null)
    }
  }

  const toggleHelpful = () => run("helpful", async () => {
    const voted = !post.voted
    onChange({ ...post, voted, helpful_count: Math.max(0, post.helpful_count + (voted ? 1 : -1)) })
    try {
      await sdk.client.fetch(`/store/forum/posts/${encodeURIComponent(post.id)}/helpful`, { method: voted ? "POST" : "DELETE" })
    } catch (caught) {
      onChange(post)
      throw caught
    }
  }, "We couldn't save your vote. Please try again.")

  const saveEdit = () => run("edit", async () => {
    const { post: updated } = await sdk.client.fetch<{ post: ForumPost }>(`/store/forum/posts/${encodeURIComponent(post.id)}`, { method: "POST", body: { body: draft.trim() } })
    onChange(updated)
    setEditing(false)
  }, "We couldn't save your changes. Please try again.")

  const remove = () => {
    const message = post.is_opening ? "Delete this thread, including every reply? This can't be undone." : "Delete your post? This can't be undone."
    if (!window.confirm(message)) return
    void run("delete", async () => {
      await sdk.client.fetch(`/store/forum/posts/${encodeURIComponent(post.id)}`, { method: "DELETE" })
      onDeleted(post)
    }, "We couldn't delete your post. Please try again.")
  }

  return <Box component="article" id={`post-${post.id}`} sx={{ scrollMarginTop: 96, py: 2.5, ...(style ? { px: { xs: 2, md: 2.5 }, my: 1.5, border: "1px solid", borderColor: style.border, borderLeftWidth: 4, borderRadius: "8px", bgcolor: style.bg } : { borderTop: "1px solid", borderColor: "divider" }) }}>
    {/* The thread header already names the opening post's author and date. */}
    {post.is_opening ? (post.edited_at ? <Typography sx={{ fontSize: 13, color: "brand.navySoft", mb: 1 }}>Edited {formatForumDate(post.edited_at)}</Typography> : null) : <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.5, rowGap: .75, mb: 1.25 }}>
      {style ? <Pill tone={style.tone} icon={highlight === "accepted" ? "checkCircle" : "shield"}>{style.label}</Pill> : null}
      <AuthorLine author={post.author} size="small" />
      <Typography component="time" dateTime={post.created_at} sx={{ fontSize: 13, color: "brand.navySoft" }}>
        {formatForumDate(post.created_at)}{post.edited_at ? " · edited" : ""}
      </Typography>
    </Box>}

    {/* The opening post's status mirrors the thread's, which the thread header already explains. */}
    {post.status && post.status !== "published" && !post.is_opening ? <Alert severity="info" sx={{ mb: 1.5 }}>
      <strong>Only you can see this {post.is_opening ? "thread" : "post"} for now.</strong> {HOLD_MESSAGES[post.hold_reason ?? ""] ?? "A moderator will review it."}
    </Alert> : null}

    {editing ? <Box>
      <TextField value={draft} onChange={event => setDraft(event.target.value.slice(0, post.is_opening ? 10000 : 5000))} multiline minRows={4} fullWidth label="Edit your post" />
      {dose ? <Alert severity="warning" sx={{ mt: 1.5 }}>“{dose}” looks like a dose amount. The community doesn&apos;t share doses, so this post would wait for a moderator.</Alert> : null}
      <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
        <Button variant="contained" size="small" onClick={() => void saveEdit()} disabled={busy === "edit" || draft.trim().length < 2}>{busy === "edit" ? "Saving…" : "Save"}</Button>
        <Button size="small" onClick={() => { setEditing(false); setDraft(post.body) }}>Cancel</Button>
      </Box>
    </Box> : <PostBody body={post.body} size={post.is_opening ? 17 : 16} />}
    <PostImages images={post.images ?? []} author={post.author.display_name} />

    {error ? <Alert severity="error" sx={{ mt: 1.5 }} onClose={() => setError(null)}>{error}</Alert> : null}

    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: 1.75 }}>
      <Button size="small" variant={post.voted ? "contained" : "outlined"} color="primary" onClick={() => void toggleHelpful()}
        disabled={!canInteract || post.mine || busy === "helpful" || post.status !== undefined && post.status !== "published"}
        aria-pressed={post.voted} title={post.mine ? "You can't vote for your own post" : canInteract ? undefined : "Sign in and join the community to vote"}
        startIcon={<Icon name="check" sx={{ fontSize: 16 }} />} sx={{ minHeight: 34 }}>
        Helpful{post.helpful_count ? ` · ${post.helpful_count}` : ""}
      </Button>
      {canAccept && !post.is_opening && !post.mine && onAccept ? <Button size="small" variant={isAccepted ? "contained" : "text"} color="success" disabled={busy === "accept"}
        onClick={() => void run("accept", () => onAccept(isAccepted ? null : post.id), "We couldn't update the best answer.")}>
        {isAccepted ? "Best answer ✓" : "Mark as best answer"}
      </Button> : null}
      {canInteract && !post.mine ? <Button size="small" color="inherit" disabled={reported} onClick={() => setReporting(true)} sx={{ color: "brand.navySoft", ml: "auto" }}>
        {reported ? "Reported" : "Report"}
      </Button> : null}
      {post.mine && !editing ? <Box sx={{ ml: "auto", display: "flex", gap: .5 }}>
        <Button size="small" onClick={() => { setDraft(post.body); setEditing(true) }}>Edit</Button>
        <Button size="small" color="error" onClick={remove} disabled={busy === "delete"}>{busy === "delete" ? "Deleting…" : "Delete"}</Button>
      </Box> : null}
    </Box>
    {reporting ? <ReportDialog postId={post.id} open={reporting} onClose={() => setReporting(false)} onReported={() => setReported(true)} /> : null}
  </Box>
}
