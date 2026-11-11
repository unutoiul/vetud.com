"use client"

import Box from "@mui/material/Box"
import LinearProgress from "@mui/material/LinearProgress"
import Paper from "@mui/material/Paper"
import Typography from "@mui/material/Typography"
import { useContentTranslator } from "@/i18n/use-content-translator"
import { formatForumDate, threadHref } from "@/lib/community/format"
import type { ForumThread, OwnForumProfile, OwnForumStats, ReputationRules } from "@/lib/community/types"
import Icon, { type IconName } from "../brand/Icon"
import { AppLink, ButtonLink } from "../common/links"
import { Pill } from "../community/Badges"
import { achievements, currentLevel, LEVEL_COLORS, LEVEL_NOTES, levelProgress, nextLevel } from "./reputation"

const card = { p: { xs: 2.5, md: 3.5 }, borderRadius: 3 } as const
/** Read by screen readers, not shown. Sizes in px: in sx, 1 would mean 100%. */
const visuallyHidden = { position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" } as const
const heading = { fontSize: 18, fontWeight: 700, letterSpacing: "-.02em" } as const

/** Points, level, progress to the next level and the whole ladder. */
export function ReputationCard({ profile, rules, stats }: { profile: OwnForumProfile; rules: ReputationRules; stats: Partial<OwnForumStats> | null }) {
  const ct = useContentTranslator()
  const level = currentLevel(rules, profile.reputation)
  const next = nextLevel(rules, profile.reputation)
  const progress = levelProgress(rules, profile.reputation)
  const color = LEVEL_COLORS[level.id]
  const { points } = rules
  const ways: { icon: IconName; label: string; value: string }[] = [
    { icon: "news", label: "Start a discussion or ask a question", value: `+${points.thread}` },
    { icon: "send", label: "Reply to a member", value: `+${points.reply}` },
    { icon: "heart", label: "Get a helpful vote", value: `+${points.helpfulVote}` },
    { icon: "checkCircle", label: "Have your reply chosen as the best answer", value: `+${points.bestAnswer}` },
    { icon: "shield", label: "A post removed by a moderator", value: `${points.removedPost}` },
  ]

  return (
    <Paper variant="outlined" sx={card}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) minmax(0, 1fr)" }, gap: { xs: 3, md: 5 } }}>
        <Box>
          <Typography variant="eyebrow" component="p" sx={{ color: "brand.blue" }}>{ct("Reputation")}</Typography>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mt: 1 }}>
            <Typography component="p" sx={{ fontSize: { xs: 44, md: 56 }, fontWeight: 400, letterSpacing: "-.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{ct(profile.reputation)}</Typography>
            <Typography component="span" sx={{ color: "text.secondary", fontSize: 15 }}>{ct("points")}</Typography>
          </Box>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mt: 1.5, px: 1.25, py: .5, borderRadius: 999, bgcolor: `${color}1a`, color, fontWeight: 700, fontSize: 14 }}>
            <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />{ct(level.name)}
          </Box>
          <Typography sx={{ mt: 1.25, fontSize: 14, color: "text.secondary", maxWidth: 420 }}>{ct(LEVEL_NOTES[level.id])}</Typography>

          <Box sx={{ mt: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", fontSize: 13, mb: .75 }}>
              <span>{ct(level.name)}</span>
              <Box component="span" sx={{ color: "text.secondary" }}>{next ? ct.template("{v0} points to {v1}", { v0: next.min - profile.reputation, v1: ct(next.name) }) : ct("Top level reached")}</Box>
            </Box>
            <LinearProgress variant="determinate" value={Math.round(progress * 100)} aria-label={ct("Progress to the next level")} sx={{ height: 10, borderRadius: 999, bgcolor: "brand.mintLight", "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: color } }} />
          </Box>

          <Box component="ol" aria-label={ct("Levels")} sx={{ listStyle: "none", m: 0, mt: 3, p: 0, display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(6, 1fr)" }, gap: 1 }}>
            {rules.levels.map((item) => {
              const reached = profile.reputation >= item.min
              const here = item.id === level.id
              return (
                <Box component="li" key={item.id} aria-current={here ? "step" : undefined} sx={{ p: 1, borderRadius: 2, border: "1px solid", borderColor: here ? LEVEL_COLORS[item.id] : "divider", bgcolor: reached ? `${LEVEL_COLORS[item.id]}14` : "transparent", textAlign: "center" }}>
                  <Typography component="span" sx={{ display: "block", fontSize: 11.5, fontWeight: here ? 700 : 600, lineHeight: 1.3, color: reached ? "text.primary" : "text.secondary" }}>{ct(item.name)}</Typography>
                  <Typography component="span" sx={{ display: "block", mt: .25, fontSize: 11, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>{ct(item.min)}</Typography>
                </Box>
              )
            })}
          </Box>
        </Box>

        <Box>
          <Typography component="h3" sx={heading}>{ct("How you earn points")}</Typography>
          <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1.5, p: 0, display: "grid", gap: .5 }}>
            {ways.map((way) => (
              <Box component="li" key={way.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
                <Icon name={way.icon} sx={{ fontSize: 18, color: "brand.blue", flexShrink: 0 }} />
                <Typography component="span" sx={{ flex: 1, fontSize: 14 }}>{ct(way.label)}</Typography>
                <Typography component="span" sx={{ fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums", color: way.value.startsWith("-") ? "error.main" : "success.main" }}>{ct(way.value)}</Typography>
              </Box>
            ))}
          </Box>
          <Typography sx={{ mt: 1.5, fontSize: 12.5, lineHeight: 1.6, color: "text.secondary" }}>
            {ct.template("Posting earns up to {v0} points{v1}. After that, points come from helpful votes and best answers, so the higher levels reflect what other members found useful.", {
              v0: rules.participation_cap,
              v1: typeof stats?.participation_points === "number" ? ct.template(" (you have {v0})", { v0: stats.participation_points }) : "",
            })}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )
}

/** Four numbers: discussions, replies, helpful votes and best answers. */
export function StatsGrid({ stats }: { stats: Partial<OwnForumStats> | null }) {
  const ct = useContentTranslator()
  const tiles: { icon: IconName; label: string; value?: number }[] = [
    { icon: "news", label: "Discussions started", value: stats?.threads },
    { icon: "send", label: "Replies", value: stats?.replies },
    { icon: "heart", label: "Helpful votes received", value: stats?.helpful_received },
    { icon: "checkCircle", label: "Best answers", value: stats?.best_answers },
  ]
  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 1.5, md: 2 } }}>
        {tiles.map((tile) => (
          <Paper key={tile.label} variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3 }}>
            <Icon name={tile.icon} sx={{ fontSize: 20, color: "brand.blue" }} />
            <Typography component="p" sx={{ mt: 1, fontSize: { xs: 28, md: 34 }, lineHeight: 1.1, letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>{typeof tile.value === "number" ? ct(tile.value) : "–"}</Typography>
            <Typography component="p" sx={{ mt: .5, fontSize: 13, color: "text.secondary" }}>{ct(tile.label)}</Typography>
          </Paper>
        ))}
      </Box>
      {stats?.pending ? (
        <Typography role="status" sx={{ mt: 1.5, fontSize: 13, color: "text.secondary", display: "flex", alignItems: "center", gap: .75 }}>
          <Icon name="clock" sx={{ fontSize: 16 }} />{ct.template("{v0} of your posts are waiting for a moderator. They count once published.", { v0: stats.pending })}
        </Typography>
      ) : null}
    </Box>
  )
}

/** Badges earned and still to earn. */
export function Achievements({ profile, stats }: { profile: OwnForumProfile; stats: Partial<OwnForumStats> | null }) {
  const ct = useContentTranslator()
  const list = achievements(profile, stats)
  const earned = list.filter((item) => item.earned).length
  return (
    <Paper variant="outlined" sx={card}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2 }}>
        <Typography component="h3" sx={heading}>{ct("Achievements")}</Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{ct.template("{v0} of {v1} earned", { v0: earned, v1: list.length })}</Typography>
      </Box>
      <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 2, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
        {list.map((item) => (
          <Box component="li" key={item.id} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", p: 1.75, borderRadius: 2, border: "1px solid", borderColor: item.earned ? "brand.lineStrong" : "divider", bgcolor: item.earned ? "brand.mintWash" : "transparent", opacity: item.earned ? 1 : .62 }}>
            <Box aria-hidden sx={{ display: "grid", placeItems: "center", width: 38, height: 38, flexShrink: 0, borderRadius: "50%", bgcolor: item.earned ? "brand.navy" : "brand.mintLight", color: item.earned ? "#fff" : "text.secondary" }}>
              <Icon name={item.earned ? item.icon : "lock"} sx={{ fontSize: 18 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="span" sx={{ display: "block", fontSize: 14, fontWeight: 700 }}>{ct(item.title)}<Box component="span" sx={visuallyHidden}>{ct(item.earned ? " (earned)" : " (not yet)")}</Box></Typography>
              <Typography component="span" sx={{ display: "block", mt: .25, fontSize: 12.5, lineHeight: 1.5, color: "text.secondary" }}>{ct(item.description)}</Typography>
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

/** The member's latest discussions, with their review status. */
export function RecentDiscussions({ threads }: { threads: ForumThread[] }) {
  const ct = useContentTranslator()
  return (
    <Paper variant="outlined" sx={card}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
        <Typography component="h3" sx={heading}>{ct("Your latest discussions")}</Typography>
        <ButtonLink href="/community/new" size="small" variant="outlined" startIcon={<Icon name="plus" sx={{ fontSize: 16 }} />}>{ct("New discussion")}</ButtonLink>
      </Box>
      {threads.length ? (
        <Box component="ul" sx={{ listStyle: "none", m: 0, mt: 1.5, p: 0 }}>
          {threads.map((thread) => (
            <Box component="li" key={thread.id} sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider", "&:last-of-type": { borderBottom: 0 } }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
                <AppLink href={threadHref(thread)} sx={{ fontWeight: 650, fontSize: 15 }}>{ct(thread.title)}</AppLink>
                {thread.status && thread.status !== "published" ? <Pill tone="pending" icon="clock">{ct(thread.status === "pending" ? "Waiting for review" : "Hidden")}</Pill> : null}
                {thread.accepted_post_id ? <Pill tone="accepted" icon="checkCircle">{ct("Answered")}</Pill> : null}
              </Box>
              <Typography sx={{ mt: .5, fontSize: 12.5, color: "text.secondary" }}>
                {ct(thread.kind === "question" ? "Question" : "Discussion")} · {ct.template("{v0} replies", { v0: thread.reply_count })} · {ct.template("{v0} helpful", { v0: thread.helpful_count })} · {formatForumDate(thread.created_at, ct.locale)}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ mt: 2, p: 3, borderRadius: 2, bgcolor: "brand.mintWash", textAlign: "center" }}>
          <Typography sx={{ fontWeight: 650 }}>{ct("You haven't started a discussion yet.")}</Typography>
          <Typography sx={{ mt: .5, fontSize: 14, color: "text.secondary" }}>{ct("Ask a question or share what you noticed, including side effects. Your first discussion earns points and a badge.")}</Typography>
        </Box>
      )}
    </Paper>
  )
}
