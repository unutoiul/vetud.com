"use client"

import { useTranslations } from "next-intl"

import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Skeleton from "@mui/material/Skeleton"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { useAccount } from "../account/AccountProvider"
import { ButtonLink } from "../common/links"

type ArticleComment = { id: string; author_name: string; body: string; created_at: string; mine: boolean }
type CommentsResponse = { comments: ArticleComment[]; count: number; offset: number; limit: number }

const PAGE_SIZE = 20
const MAX_LENGTH = 2000

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "status" in error && error.status === 401) return "Your session has expired. Please sign in again to comment."
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string" && error.message) return error.message
  return fallback
}

function formatCommentDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(date))
}

/** Public discussion under an article. Anyone can read; signed-in customers can post and delete their own comments. */
export default function ArticleComments({ article }: { article: string }) {
  const act = useTranslations("Actions")
  const { customer, loading: accountLoading } = useAccount()
  const [comments, setComments] = useState<ArticleComment[]>([])
  const [count, setCount] = useState(0)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [loadingMore, setLoadingMore] = useState(false)
  const [body, setBody] = useState("")
  const [posting, setPosting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchPage = useCallback((offset: number) => sdk.client.fetch<CommentsResponse>("/store/article-comments", {
    query: { article, offset, limit: PAGE_SIZE },
    cache: "no-store",
  }), [article])

  // Reload when the reader signs in or out, so "Delete" shows on their own comments only.
  const customerId = customer?.id
  useEffect(() => {
    if (accountLoading) return
    let cancelled = false
    fetchPage(0).then(data => {
      if (cancelled) return
      setComments(data.comments)
      setCount(data.count)
      setStatus("ready")
    }).catch(() => { if (!cancelled) setStatus("error") })
    return () => { cancelled = true }
  }, [fetchPage, accountLoading, customerId])

  const retry = () => {
    setStatus("loading")
    fetchPage(0).then(data => { setComments(data.comments); setCount(data.count); setStatus("ready") }).catch(() => setStatus("error"))
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const data = await fetchPage(comments.length)
      setComments(current => [...current, ...data.comments.filter(comment => !current.some(existing => existing.id === comment.id))])
      setCount(data.count)
    } catch {
      setFormError("We couldn't load more comments. Please try again.")
    } finally {
      setLoadingMore(false)
    }
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (text.length < 2) {
      setFormError("Please write a comment first.")
      return
    }
    setPosting(true)
    setFormError(null)
    try {
      const { comment } = await sdk.client.fetch<{ comment: ArticleComment }>("/store/article-comments", {
        method: "POST",
        body: { article, body: text },
      })
      setComments(current => [comment, ...current])
      setCount(current => current + 1)
      setBody("")
    } catch (error) {
      setFormError(errorMessage(error, "We couldn't post your comment. Please try again."))
    } finally {
      setPosting(false)
    }
  }

  const remove = async (comment: ArticleComment) => {
    if (!window.confirm("Delete your comment? This can't be undone.")) return
    setDeleting(comment.id)
    setFormError(null)
    try {
      await sdk.client.fetch(`/store/article-comments/${encodeURIComponent(comment.id)}`, { method: "DELETE" })
      setComments(current => current.filter(existing => existing.id !== comment.id))
      setCount(current => Math.max(0, current - 1))
    } catch (error) {
      setFormError(errorMessage(error, "We couldn't delete your comment. Please try again."))
    } finally {
      setDeleting(null)
    }
  }

  return <Stack spacing={3}>
    {accountLoading ? <Skeleton variant="rounded" height={150} /> : customer ? (
      <Box component="form" noValidate onSubmit={submit} aria-busy={posting}>
        <TextField
          label={act("commentAs", { name: customer.first_name || act("reader") })}
          multiline minRows={3} fullWidth value={body}
          onChange={event => { setBody(event.target.value.slice(0, MAX_LENGTH)); if (formError) setFormError(null) }}
          helperText={`${body.length}/${MAX_LENGTH} · Comments are public and show your first name and last initial. Please don’t share doses or personal medical advice; we remove comments that do.`}
          slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
        />
        <Button type="submit" variant="contained" disabled={posting || !body.trim()} startIcon={posting ? <CircularProgress size={16} color="inherit" /> : null} sx={{ mt: 2 }}>
          {posting ? act("posting") : act("postComment")}
        </Button>
      </Box>
    ) : (
      <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", borderRadius: 2, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: 16, color: "brand.navySoft", lineHeight: 1.7 }}>Sign in to your Vetud account to join the discussion.</Typography>
        <ButtonLink href="/account" variant="contained" sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}>{act("signInComment")}</ButtonLink>
      </Box>
    )}

    {formError ? <Alert severity="error" onClose={() => setFormError(null)}>{formError}</Alert> : null}

    {status === "loading" ? (
      <Stack spacing={2} role="status" aria-label={act("loadingComments")}><Skeleton variant="rounded" height={88} /><Skeleton variant="rounded" height={88} /></Stack>
    ) : status === "error" ? (
      <Alert severity="error" action={<Button color="inherit" onClick={retry}>{act("retry")}</Button>}>We couldn&apos;t load the comments.</Alert>
    ) : comments.length ? (
      <Box component="ol" aria-label={`${count} ${count === 1 ? "comment" : "comments"}`} sx={{ m: 0, p: 0, listStyle: "none", display: "grid", gap: 0 }}>
        {comments.map(comment => <Box component="li" key={comment.id} sx={{ py: 2.5, borderTop: "1px solid", borderColor: "divider", "&:first-of-type": { borderTop: 0, pt: 0 } }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 1.5, rowGap: .5, mb: 1 }}>
            <Typography component="span" sx={{ fontSize: 15, fontWeight: 700, color: "brand.navy" }}>{comment.author_name}{comment.mine ? " (you)" : ""}</Typography>
            <Typography component="time" dateTime={comment.created_at} sx={{ fontSize: 13.5, color: "brand.navySoft" }}>{formatCommentDate(comment.created_at)}</Typography>
            {comment.mine ? <Button size="small" color="error" onClick={() => void remove(comment)} disabled={deleting === comment.id} sx={{ ml: "auto", minHeight: 32 }}>{deleting === comment.id ? act("deleting") : act("delete")}</Button> : null}
          </Box>
          <Typography sx={{ fontSize: 16, lineHeight: 1.75, color: "brand.navySoft", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{comment.body}</Typography>
        </Box>)}
      </Box>
    ) : (
      <Typography sx={{ fontSize: 16, color: "brand.navySoft" }}>No comments yet.{customer ? " Start the discussion." : ""}</Typography>
    )}

    {status === "ready" && comments.length < count ? (
      <Button variant="outlined" onClick={() => void loadMore()} disabled={loadingMore} sx={{ alignSelf: "flex-start" }}>
        {loadingMore ? act("loading") : act("moreComments", { count: count - comments.length })}
      </Button>
    ) : null}
  </Stack>
}
