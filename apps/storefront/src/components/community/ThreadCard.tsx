import { translateAction } from "@/i18n/actions"
import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { AppLink } from "../common/links"
import { AuthorLine, Pill } from "./Badges"
import { getPeptide } from "@/content/learn/peptides"
import { formatForumDate, KIND_LABELS, plural, threadHref } from "@/lib/community/format"
import { getTopic } from "@/lib/community/topics"
import type { ForumThread } from "@/lib/community/types"

const KIND_TONES = { question: "expert", discussion: "neutral" } as const

/**
 * One row in a thread list: kind, title, excerpt, what it's about, who wrote it and activity.
 * `showTopic` adds the topic, for lists that mix topics.
 */
export default function ThreadCard({ thread, showTopic = false }: { thread: ForumThread; showTopic?: boolean }) {
  const act = useTranslations("Actions")
  const peptide = thread.peptide_slug ? getPeptide(thread.peptide_slug) : undefined
  const topic = showTopic ? getTopic(thread.topic) : undefined
  const answered = thread.kind === "question" && thread.accepted_post_id
  return <Box component="article" sx={{ py: { xs: 2.5, md: 3 }, borderTop: "1px solid", borderColor: "divider", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto" }, columnGap: 4, rowGap: 1.5 }}>
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: .75, mb: 1 }}>
        {thread.pinned ? <Pill tone="moderator">Pinned</Pill> : null}
        <Pill tone={KIND_TONES[thread.kind]}>{translateAction(act, KIND_LABELS[thread.kind])}</Pill>
        {answered ? <Pill tone="accepted" icon="check">Answered</Pill> : null}
        {topic ? <AppLink href={`/community?topic=${topic.id}`} underline="hover" sx={{ fontSize: 13, color: "brand.blue", fontWeight: 600 }}>{translateAction(act, topic.name)}</AppLink> : null}
        {peptide ? <Typography component="span" sx={{ fontSize: 13, color: "brand.navySoft" }}>{peptide.name}</Typography> : null}
        {thread.lot ? <Typography component="span" variant="mono" sx={{ fontSize: 12, color: "brand.navySoft" }}>{act("lot")} {thread.lot}</Typography> : null}
      </Box>
      <Typography component="h3" sx={{ fontSize: { xs: 18, md: 20 }, fontWeight: 650, lineHeight: 1.35, letterSpacing: "-.01em", textWrap: "pretty" }}>
        <AppLink href={threadHref(thread)} underline="hover" sx={{ color: "brand.navy" }}>{thread.title}</AppLink>
      </Typography>
      <Typography sx={{ mt: .75, fontSize: 15, lineHeight: 1.65, color: "brand.navySoft", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{thread.excerpt}</Typography>
      <Box sx={{ mt: 1.25 }}><AuthorLine author={thread.author} verified={thread.verified_purchase} verifiedLot={thread.lot} size="small" /></Box>
    </Box>
    <Box sx={{ display: "flex", flexDirection: { xs: "row", md: "column" }, alignItems: { md: "flex-end" }, justifyContent: { md: "center" }, gap: { xs: 2, md: .5 }, fontSize: 13, color: "brand.navySoft", whiteSpace: "nowrap" }}>
      <span>{plural(thread.reply_count, "reply", "replies")}</span>
      <span>{plural(thread.helpful_count, "helpful vote")}</span>
      <Box component="time" dateTime={thread.last_activity_at}>{formatForumDate(thread.last_activity_at)}</Box>
    </Box>
  </Box>
}
