"use client"
import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"
import { useContentTranslator } from "@/i18n/use-content-translator"


import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Button from "@mui/material/Button"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { sdk } from "@/lib/medusa/sdk"
import { revalidateCommunity } from "@/lib/community/actions"
import { formatForumDate, HOLD_MESSAGES, KIND_LABELS, KIND_PLURALS } from "@/lib/community/format"
import type { ForumPost, ForumThreadDetail } from "@/lib/community/types"
import { getPeptide } from "@/content/learn/peptides"
import { useAccount } from "../account/AccountProvider"
import { AppLink, ButtonLink, useLocalizedHref } from "../common/links"
import { AuthorLine, Pill } from "./Badges"
import JoinCommunity from "./JoinCommunity"
import PostCard from "./PostCard"
import ReplyForm from "./ReplyForm"
import { useCommunityProfile } from "./useCommunityProfile"
import { getTopic } from "@/lib/community/topics"

const PAGE_SIZE = 100

/**
 * A thread page. The server renders the public version (so search engines see it); signed in,
 * it reloads with the reader's votes and own posts waiting for review, and adds the controls.
 */
export default function ThreadView({ threadId, initial }: { threadId: string; initial: ForumThreadDetail | null }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  const router = useRouter()
  const localize = useLocalizedHref()
  const { customer, loading: accountLoading } = useAccount()
  const community = useCommunityProfile()
  const [detail, setDetail] = useState(initial)
  const [state, setState] = useState<"ready" | "loading" | "missing">(initial ? "ready" : "loading")
  const [loadingMore, setLoadingMore] = useState(false)
  const customerId = customer?.id

  const fetchPage = useCallback((offset: number) => sdk.client.fetch<ForumThreadDetail>(`/store/forum/threads/${encodeURIComponent(threadId)}`, {
    query: { offset, limit: PAGE_SIZE },
    cache: "no-store",
  }), [threadId])

  // The public page is cached for a few minutes; signed-in readers get their own view.
  useEffect(() => {
    if (accountLoading || (!customerId && initial)) return
    let cancelled = false
    fetchPage(0)
      .then(data => { if (!cancelled) { setDetail(data); setState("ready") } })
      .catch(() => { if (!cancelled && !initial) setState("missing") })
    return () => { cancelled = true }
  }, [accountLoading, customerId, fetchPage, initial])

  const refresh = useCallback(() => { void revalidateCommunity(threadId) }, [threadId])

  const updatePost = useCallback((post: ForumPost) => setDetail(current => current && ({
    ...current,
    opening: current.opening.id === post.id ? post : current.opening,
    accepted: current.accepted?.id === post.id ? post : current.accepted,
    posts: current.posts.map(existing => existing.id === post.id ? post : existing),
  })), [])

  const { highlighted, expert, others } = useMemo(() => {
    if (!detail) return { highlighted: null, expert: null, others: [] as ForumPost[] }
    const accepted = detail.accepted
    // The most helpful expert reply that isn't already the best answer is pinned under it.
    const expertReply = [...detail.posts]
      .filter(post => post.author.role === "expert" && post.id !== accepted?.id)
      .sort((a, b) => b.helpful_count - a.helpful_count)[0] ?? null
    return {
      highlighted: accepted,
      expert: expertReply,
      others: detail.posts.filter(post => post.id !== accepted?.id && post.id !== expertReply?.id),
    }
  }, [detail])

  if (state === "loading" && !detail) {
    return <Box role="status" aria-label={act("loadingThread")} sx={{ display: "grid", gap: 2 }}><Skeleton variant="text" height={64} /><Skeleton variant="rounded" height={240} /></Box>
  }
  if (!detail) {
    return <Box sx={{ py: 6, textAlign: "center" }}>
      <Typography component="h1" sx={{ fontSize: 28, fontWeight: 650 }}>{ct("This thread isn't available")}</Typography>
      <Typography sx={{ mt: 1.5, color: "brand.navySoft" }}>{ct("It may have been removed, or it's waiting for a moderator to review it.")}</Typography>
      <ButtonLink href="/community" variant="contained" sx={{ mt: 3 }}>{act("backCommunity")}</ButtonLink>
    </Box>
  }

  const { thread, opening, viewer } = detail
  const peptide = thread.peptide_slug ? getPeptide(thread.peptide_slug) : undefined
  const canInteract = Boolean(community.profile && community.profile.status === "active")
  const question = thread.kind === "question"
  const shared = {
    thread,
    canInteract,
    canAccept: viewer.can_accept,
    onChange: (post: ForumPost) => { updatePost(post); refresh() },
    onDeleted: (post: ForumPost) => {
      refresh()
      if (post.is_opening) {
        router.push(localize("/community"))
        return
      }
      setDetail(current => current && ({ ...current, posts: current.posts.filter(existing => existing.id !== post.id), accepted: current.accepted?.id === post.id ? null : current.accepted, count: Math.max(0, current.count - 1) }))
    },
    onAccept: async (postId: string | null) => {
      await sdk.client.fetch(`/store/forum/threads/${encodeURIComponent(thread.id)}/accept`, { method: "POST", body: { post_id: postId } })
      setDetail(current => current && ({ ...current, thread: { ...current.thread, accepted_post_id: postId }, accepted: postId ? current.posts.find(post => post.id === postId) ?? null : null }))
      refresh()
    },
  }

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const next = await fetchPage(detail.posts.length)
      setDetail(current => current && ({ ...current, posts: [...current.posts, ...next.posts.filter(post => !current.posts.some(existing => existing.id === post.id))], count: next.count }))
    } finally {
      setLoadingMore(false)
    }
  }

  return <Box>
    <Box component="nav" aria-label={act("breadcrumb")} sx={{ display: "flex", flexWrap: "wrap", gap: 1, fontSize: 14, color: "brand.navySoft", mb: 2 }}>
      <AppLink href="/community">{act("community")}</AppLink><span aria-hidden>/</span>
      {getTopic(thread.topic) ? <><AppLink href={`/community?topic=${thread.topic}`}>{translateAction(act, getTopic(thread.topic)?.name ?? "")}</AppLink><span aria-hidden>/</span></> : null}
      <AppLink href={`/community?${getTopic(thread.topic) ? `topic=${thread.topic}&` : ""}kind=${thread.kind}`}>{translateAction(act, KIND_PLURALS[thread.kind])}</AppLink>
    </Box>

    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: .75, mb: 1.5 }}>
      {thread.pinned ? <Pill tone="moderator">{ct("Pinned")}</Pill> : null}
      <Pill tone={thread.kind === "question" ? "expert" : "neutral"}>{translateAction(act, KIND_LABELS[thread.kind])}</Pill>
      {question && thread.accepted_post_id ? <Pill tone="accepted" icon="check">{ct("Answered")}</Pill> : null}
      {thread.locked ? <Pill>{ct("Closed")}</Pill> : null}
    </Box>
    <Typography component="h1" translate="no" sx={{ fontSize: { xs: 30, md: 42 }, fontWeight: 500, lineHeight: 1.15, letterSpacing: "-.035em", textWrap: "balance", color: "brand.navy" }}>{thread.title}</Typography>
    <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: 2, rowGap: 1 }}>
      <AuthorLine author={thread.author} />
      <Typography component="time" dateTime={thread.created_at} sx={{ fontSize: 14, color: "brand.navySoft" }}>{ct.rich("Started {v0}", { v0: ct(formatForumDate(thread.created_at, ct.locale)) }, {  })}</Typography>
    </Box>
    {peptide ? <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1, "& a": { display: "inline-flex", alignItems: "center", minHeight: 36, px: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 999, fontSize: 13.5, bgcolor: "#fff" } }}>
      {peptide ? <AppLink href={`/learn/${peptide.slug}`} underline="none">{act("about")} {ct(peptide.name)}</AppLink> : null}
    </Box> : null}

    {thread.status && thread.status !== "published" ? <Alert severity="info" sx={{ mt: 3 }}>
      <strong>{ct("Only you can see this thread for now.")}</strong> {ct(HOLD_MESSAGES[thread.hold_reason ?? ""] ?? "A moderator will review it.")}
    </Alert> : null}

    <Box sx={{ mt: 1 }}><PostCard post={opening} {...shared} /></Box>

    <Box component="section" aria-labelledby="replies-heading" sx={{ mt: 4 }}>
      <Typography id="replies-heading" component="h2" sx={{ fontSize: 22, fontWeight: 650, mb: 1 }}>
        {ct(detail.count ? ct.count(detail.count, question ? "answer" : "reply", question ? "answers" : "replies") : question ? "No answers yet" : "No replies yet")}
      </Typography>
      {highlighted ? <PostCard post={highlighted} highlight="accepted" {...shared} /> : null}
      {expert ? <PostCard post={expert} highlight="expert" {...shared} /> : null}
      {others.map(post => <PostCard key={post.id} post={post} {...shared} />)}
      {detail.posts.length < detail.count ? <Button variant="outlined" onClick={() => void loadMore()} disabled={loadingMore} sx={{ mt: 2 }}>
        {ct(loadingMore ? act("loading") : act("moreItems", { count: detail.count - detail.posts.length }))}
      </Button> : null}
    </Box>

    <Box component="section" aria-label={ct(question ? act("yourAnswer") : act("yourReply"))} sx={{ mt: 4, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
      {thread.locked ? <Typography sx={{ color: "brand.navySoft" }}>{ct("This thread is closed to new replies.")}</Typography>
        : community.loading ? <Skeleton variant="rounded" height={150} />
          : !community.signedIn ? <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", borderRadius: 2, display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}>
            <Typography sx={{ fontSize: 16, color: "brand.navySoft", lineHeight: 1.7 }}>{ct.rich("Sign in to your Vetud account to {v0}, vote and report.", { v0: ct(question ? "answer" : "reply") }, {  })}</Typography>
            <ButtonLink href="/account" variant="contained" sx={{ flexShrink: 0 }}>{act("signIn")}</ButtonLink>
          </Box>
            : !community.profile ? <JoinCommunity suggested={community.suggested} onJoined={community.setProfile} />
              : community.profile.status !== "active" ? <Alert severity="info">{ct("Your community account can't post right now. Contact us if you think this is a mistake.")}</Alert>
                : <ReplyForm threadId={thread.id} profile={community.profile} question={question} onPosted={post => {
                  setDetail(current => current && ({ ...current, posts: [...current.posts, post], count: current.count + (post.status === "published" ? 1 : 0) }))
                  if (post.status === "published") refresh()
                }} />}
    </Box>
  </Box>
}
