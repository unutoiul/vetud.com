import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import Icon from "../brand/Icon"
import { AppLink } from "../common/links"
import { formatForumDate, plural } from "@/lib/community/format"
import { COMMUNITY_TOPICS, type CommunityTopic } from "@/lib/community/topics"
import type { ForumStats } from "@/lib/community/types"

type Counts = ForumStats["topics"]

const topicHref = (topic?: CommunityTopic) => topic ? `/community?topic=${topic.id}` : "/community"

/**
 * The topic list: a vertical menu beside the threads on large screens, a row of scrollable chips
 * above them on small ones. The current topic is marked with aria-current.
 */
export function TopicNav({ current, counts, total }: { current?: string; counts?: Counts; total?: number }) {
  const items = [{ id: undefined, name: "All topics", icon: "globe" as const, count: total }, ...COMMUNITY_TOPICS.map((topic) => ({ id: topic.id, name: topic.name, icon: topic.icon, count: counts?.[topic.id]?.threads ?? 0 }))]
  return (
    <Box component="nav" aria-label="Community topics" sx={{ minWidth: 0 }}>
      <Typography variant="mono" component="h2" sx={{ display: { xs: "none", lg: "block" }, fontSize: 10, letterSpacing: ".14em", color: "brand.blue", mb: 1.25 }}>TOPICS</Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", flexDirection: { xs: "row", lg: "column" }, gap: { xs: 1, lg: .25 }, overflowX: { xs: "auto", lg: "visible" }, pb: { xs: 1, lg: 0 }, mx: { xs: -2.5, sm: 0 }, px: { xs: 2.5, sm: 0 } }}>
        {items.map((item) => {
          const active = item.id === current
          const topic = COMMUNITY_TOPICS.find((entry) => entry.id === item.id)
          return (
            <Box component="li" key={item.name} sx={{ flexShrink: 0 }}>
              <AppLink href={topicHref(topic)} aria-current={active ? "page" : undefined} underline="none" sx={{
                display: "flex", alignItems: "center", gap: 1.25, minHeight: 44, px: 1.5, borderRadius: { xs: 999, lg: "8px" },
                border: { xs: "1px solid", lg: "none" }, borderColor: active ? "brand.blue" : "divider",
                bgcolor: active ? "brand.mintWash" : "transparent", color: active ? "brand.navy" : "brand.navySoft",
                fontSize: 14, fontWeight: active ? 650 : 500, whiteSpace: "nowrap",
                "&:hover": { bgcolor: "brand.mintWash", color: "brand.navy" },
              }}>
                <Icon name={item.icon} sx={{ fontSize: 18, color: "brand.blue", flexShrink: 0 }} />
                <Box component="span" sx={{ flex: 1 }}>{item.name}</Box>
                {item.count ? <Box component="span" sx={{ fontSize: 12.5, color: "brand.navySoft", fontVariantNumeric: "tabular-nums" }}>{item.count}</Box> : null}
              </AppLink>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

/** "Browse by topic": a card per topic with its threads and latest activity, or an invitation to post first. */
export function TopicGrid({ counts }: { counts?: Counts }) {
  return (
    <Box component="section" aria-labelledby="browse-topics" sx={{ mb: { xs: 5, md: 6 } }}>
      <Typography component="h2" id="browse-topics" sx={{ fontSize: { xs: 20, md: 22 }, fontWeight: 650, letterSpacing: "-.01em", mb: 2 }}>Browse by topic</Typography>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
        {COMMUNITY_TOPICS.map((topic) => {
          const stats = counts?.[topic.id]
          return (
            <Box component="li" key={topic.id} sx={{ position: "relative", display: "flex", gap: 1.75, p: 2.25, border: "1px solid", borderColor: "divider", borderRadius: "10px", bgcolor: "#fff", transition: "border-color .15s ease, box-shadow .15s ease", "&:hover, &:focus-within": { borderColor: "brand.blue", boxShadow: "0 10px 24px -18px rgba(21,38,94,.45)" } }}>
              <Box aria-hidden sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: "10px", bgcolor: "brand.mintWash", color: "brand.blue", display: "grid", placeItems: "center" }}><Icon name={topic.icon} sx={{ fontSize: 21 }} /></Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h3" sx={{ fontSize: 16, fontWeight: 650, lineHeight: 1.35 }}>
                  {/* The whole card is the link's target area. */}
                  <AppLink href={topicHref(topic)} underline="none" sx={{ color: "brand.navy", "&::after": { content: '""', position: "absolute", inset: 0, borderRadius: "10px" }, "&:focus-visible": { outline: "none" }, "&:focus-visible::after": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>{topic.name}</AppLink>
                </Typography>
                <Typography sx={{ mt: .5, fontSize: 13.5, lineHeight: 1.55, color: "brand.navySoft" }}>{topic.description}</Typography>
                <Typography sx={{ mt: 1, fontSize: 12.5, color: stats?.threads ? "brand.navySoft" : "brand.blue", fontWeight: stats?.threads ? 400 : 600 }}>
                  {stats?.threads ? `${plural(stats.threads, "thread")}${stats.last_activity_at ? ` · active ${formatForumDate(stats.last_activity_at)}` : ""}` : "Be the first to post"}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

/** Ideas for a first post, each opening the composer with the question filled in. */
export function StarterPrompts({ topic, prompts }: { topic?: CommunityTopic; prompts: string[] }) {
  return (
    <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 1, textAlign: "left" }}>
      {prompts.map((prompt) => (
        <Box component="li" key={prompt}>
          <AppLink href={`/community/new?kind=question${topic ? `&topic=${topic.id}` : ""}&title=${encodeURIComponent(prompt)}`} underline="none" sx={{ display: "flex", alignItems: "center", gap: 1.25, minHeight: 48, px: 2, py: 1, border: "1px solid", borderColor: "divider", borderRadius: "8px", bgcolor: "#fff", color: "brand.navy", fontSize: 14.5, "&:hover": { borderColor: "brand.blue", bgcolor: "brand.mintWash" } }}>
            <Icon name="plus" sx={{ fontSize: 16, color: "brand.blue", flexShrink: 0 }} />
            <Box component="span" sx={{ flex: 1 }}>{prompt}</Box>
            <Box component="span" sx={{ fontSize: 12.5, color: "brand.blue", fontWeight: 600, whiteSpace: "nowrap" }}>Ask this</Box>
          </AppLink>
        </Box>
      ))}
    </Box>
  )
}
