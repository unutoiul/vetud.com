import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { Suspense } from "react"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink, ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import CommunityDisclaimer from "@/components/community/CommunityDisclaimer"
import ThreadCard from "@/components/community/ThreadCard"
import ThreadFilters from "@/components/community/ThreadFilters"
import { StarterPrompts, TopicGrid, TopicNav } from "@/components/community/Topics"
import { getPeptide } from "@/content/learn/peptides"
import { KIND_LABELS, plural, THREAD_KINDS } from "@/lib/community/format"
import { communityMetadata } from "@/lib/community/seo"
import { COMMUNITY_TOPICS, getTopic, type CommunityTopic } from "@/lib/community/topics"
import type { ForumStats, ThreadFilters as Filters } from "@/lib/community/types"
import { getForumStats, listForumThreads } from "@/lib/medusa/forum"

type Params = Record<string, string | string[] | undefined>

export async function generateMetadata({ searchParams }: PageProps<"/[countryCode]/community">): Promise<Metadata> {
  const { topic: topicParam } = await searchParams
  const topic = getTopic(typeof topicParam === "string" ? topicParam : undefined)
  return topic
    ? communityMetadata({ path: `/community?topic=${topic.id}`, title: `${topic.name}: Peptide Research Questions and Discussions`, description: `${topic.description} Questions and discussions about the research, without doses.` })
    : communityMetadata({ path: "/community", title: "Peptide Research Community: Questions, Discussions and Expert Answers", description: "Questions answered by verified experts and open discussions about peptide research, by topic and without doses." })
}

const PAGE_SIZE = 20

/** What members can rely on, shown under the header instead of thin early numbers. */
const PROMISES: { icon: IconName; title: string; text: string }[] = [
  { icon: "shield", title: "No doses, no protocols", text: "Posts with dose amounts wait for a moderator." },
  { icon: "document", title: "Sources welcome", text: "Link the study you're talking about." },
  { icon: "checkCircle", title: "Verified experts", text: "Doctors and researchers checked by our team." },
  { icon: "eye", title: "Moderated", text: "Three reports hide a post until it's reviewed." },
]

export default function CommunityPage({ searchParams }: PageProps<"/[countryCode]/community">) {
  return <>
    <PageHeader eyebrow="Community" title="Research, discussed in the open." description="Ask questions and talk through the research with other members and verified experts, by topic. No doses, no hype.">
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <ButtonLink href="/community/new?kind=question" variant="contained" size="large">Ask a question</ButtonLink>
        <ButtonLink href="/community/new?kind=discussion" variant="outlined" size="large">Start a discussion</ButtonLink>
      </Box>
    </PageHeader>
    <Box component="section" aria-label="How the community works" sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "#fff" }}>
      <Box component="ul" sx={{ listStyle: "none", m: "0 auto", maxWidth: 1360, px: { xs: 2.5, sm: 4, md: 6, lg: 8 }, py: { xs: 2.5, md: 3 }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: { xs: 2, md: 3 } }}>
        {PROMISES.map(item => <Box component="li" key={item.title} sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
          <Box aria-hidden sx={{ width: 34, height: 34, flexShrink: 0, borderRadius: "9px", bgcolor: "brand.mintWash", color: "brand.blue", display: "grid", placeItems: "center" }}><Icon name={item.icon} sx={{ fontSize: 18 }} /></Box>
          <Box>
            <Typography sx={{ fontSize: 14.5, fontWeight: 650, color: "brand.navy" }}>{item.title}</Typography>
            <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: "brand.navySoft" }}>{item.text}</Typography>
          </Box>
        </Box>)}
      </Box>
    </Box>
    <Section tone="white" sx={{ py: { xs: 4, md: 6 } }}>
      <Suspense fallback={<Skeleton variant="rounded" height={320} />}>
        <Community searchParams={searchParams} />
      </Suspense>
      <CommunityDisclaimer sx={{ mt: { xs: 6, md: 8 }, pt: 3, borderTop: "1px solid", borderColor: "divider" }} />
    </Section>
  </>
}

function readFilters(params: Params): Filters & { page: number } {
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : undefined
  const kind = THREAD_KINDS.find(entry => entry === value("kind"))
  const sort = value("sort") === "top" || value("sort") === "unanswered" ? value("sort") as "top" | "unanswered" : "latest"
  const topic = getTopic(value("topic"))?.id
  const peptide = getPeptide(value("peptide") ?? "")?.slug
  const lot = value("lot")?.trim().toUpperCase().slice(0, 40) || undefined
  const q = value("q")?.trim().slice(0, 80) || undefined
  const page = Math.max(1, Math.min(500, Number.parseInt(value("page") ?? "1", 10) || 1))
  return { kind, sort, topic, peptides: peptide ? [peptide] : undefined, lot: lot && /^[A-Z0-9][A-Z0-9 _./-]{2,}$/.test(lot) ? lot : undefined, q, page }
}

/** Topics beside the feed; the topic cards on the front page; the thread list with its controls. */
async function Community({ searchParams }: Pick<PageProps<"/[countryCode]/community">, "searchParams">) {
  const { page, ...filters } = readFilters(await searchParams)
  const stats = await getForumStats().catch(() => undefined)
  const topic = getTopic(filters.topic)
  const front = !topic && !filters.kind && !filters.peptides && !filters.lot && !filters.q && filters.sort === "latest" && page === 1

  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "250px minmax(0, 1fr)" }, gap: { xs: 3, lg: 6 }, alignItems: "start" }}>
    <Box component="aside" sx={{ position: { lg: "sticky" }, top: { lg: 112 }, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 3, minWidth: 0 }}>
      {/* On small screens the front page's topic cards already list every topic. */}
      <Box sx={{ display: { xs: front ? "none" : "block", lg: "block" }, minWidth: 0 }}><TopicNav current={topic?.id} counts={stats?.topics} total={stats?.threads} /></Box>
      <Box sx={{ display: { xs: "none", lg: "block" } }}><SideNotes /></Box>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      {stats?.threads ? <CommunityStats stats={stats} /> : null}
      {front ? <TopicGrid counts={stats?.topics} /> : null}
      {topic ? <TopicHeader topic={topic} threads={stats?.topics?.[topic.id]?.threads ?? 0} /> : null}
      {front ? <Typography component="h2" sx={{ fontSize: { xs: 20, md: 22 }, fontWeight: 650, letterSpacing: "-.01em", mb: 1.5 }}>Latest threads</Typography> : null}
      <Suspense fallback={<Skeleton variant="rounded" height={112} />}><ThreadFilters /></Suspense>
      <ThreadList filters={filters} page={page} topic={topic} empty={!stats?.threads} />
      <Box sx={{ display: { xs: "block", lg: "none" }, mt: 5 }}><SideNotes /></Box>
    </Box>
  </Box>
}

function CommunityStats({ stats }: { stats: ForumStats }) {
  const items = [plural(stats.threads, "thread"), plural(stats.members, "member"), ...(stats.experts ? [plural(stats.experts, "verified expert")] : [])]
  return <Box component="ul" aria-label="Community at a glance" sx={{ listStyle: "none", m: 0, mb: 3, p: 0, display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: 1, fontSize: 14, color: "brand.navySoft", "& li strong": { color: "brand.navy", fontVariantNumeric: "tabular-nums" } }}>
    {items.map(item => { const [count, ...words] = item.split(" "); return <li key={item}><strong>{count}</strong> {words.join(" ")}</li> })}
  </Box>
}

function TopicHeader({ topic, threads }: { topic: CommunityTopic; threads: number }) {
  return <Box component="header" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, p: { xs: 2.5, md: 3 }, mb: 3, bgcolor: "brand.mintWash", borderRadius: "12px" }}>
    <Box aria-hidden sx={{ width: 48, height: 48, flexShrink: 0, borderRadius: "12px", bgcolor: "#fff", color: "brand.blue", display: "grid", placeItems: "center" }}><Icon name={topic.icon} sx={{ fontSize: 24 }} /></Box>
    <Box sx={{ flex: "1 1 280px", minWidth: 0 }}>
      <Typography component="h2" sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 650, letterSpacing: "-.02em", lineHeight: 1.25 }}>{topic.name}</Typography>
      <Typography sx={{ mt: .5, fontSize: 14.5, color: "brand.navySoft", lineHeight: 1.6 }}>{topic.description}{threads ? ` · ${plural(threads, "thread")}` : ""}</Typography>
    </Box>
    <ButtonLink href={`/community/new?kind=question&topic=${topic.id}`} variant="contained">Ask in {topic.name}</ButtonLink>
  </Box>
}

/** How the community works, guidelines, and the invitation for experts. */
function SideNotes() {
  return <Box sx={{ display: "grid", gap: 2 }}>
    <Box sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: "10px" }}>
      <Typography component="h2" sx={{ fontSize: 15, fontWeight: 650, color: "brand.navy" }}>Good threads here</Typography>
      <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.25, fontSize: 13.5, lineHeight: 1.65, color: "brand.navySoft", "& li": { mb: .5 } }}>
        <li>Ask one clear question, in the right topic.</li>
        <li>Link the study or source you mean.</li>
        <li>Leave out doses and personal protocols.</li>
        <li>Mark the most helpful answer as best.</li>
      </Box>
      <AppLink href="/community/guidelines" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 600 }}>Read the community guidelines</AppLink>
    </Box>
    <Box sx={{ p: 2.5, bgcolor: "brand.navy", color: "#fff", borderRadius: "10px" }}>
      <Icon name="shield" sx={{ fontSize: 22, color: "#abcce3" }} />
      <Typography component="h2" sx={{ mt: 1, fontSize: 15, fontWeight: 650 }}>Doctor or researcher?</Typography>
      <Typography sx={{ mt: .5, fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,.8)" }}>Verified experts get a badge with their credentials, and their answers are pinned.</Typography>
      <AppLink href={`/contact?subject=${encodeURIComponent("Verified expert application")}`} sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 650, color: "#fff", textDecorationColor: "rgba(255,255,255,.5)" }}>Apply to be verified →</AppLink>
    </Box>
  </Box>
}

async function ThreadList({ filters, page, topic, empty }: { filters: Filters; page: number; topic?: CommunityTopic; empty: boolean }) {
  let result
  try {
    result = await listForumThreads({ ...filters, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
  } catch {
    return <Alert severity="error" sx={{ mt: 3 }}>We couldn&apos;t load the community right now. Please try again in a moment.</Alert>
  }
  const pages = Math.max(1, Math.ceil(result.count / PAGE_SIZE))
  const query = (target: number) => {
    const next = new URLSearchParams()
    if (filters.topic) next.set("topic", filters.topic)
    if (filters.kind) next.set("kind", filters.kind)
    if (filters.sort && filters.sort !== "latest") next.set("sort", filters.sort)
    if (filters.peptides?.[0]) next.set("peptide", filters.peptides[0])
    if (filters.lot) next.set("lot", filters.lot)
    if (filters.q) next.set("q", filters.q)
    if (target > 1) next.set("page", String(target))
    const text = next.toString()
    return `/community${text ? `?${text}` : ""}`
  }
  const peptide = filters.peptides?.[0] ? getPeptide(filters.peptides[0]) : undefined
  const narrowed = Boolean(filters.kind || filters.peptides || filters.lot || filters.q || filters.sort === "unanswered")
  const composeHref = `/community/new?kind=${filters.kind ?? "question"}${topic ? `&topic=${topic.id}` : ""}${peptide ? `&peptide=${peptide.slug}` : ""}${filters.lot ? `&lot=${encodeURIComponent(filters.lot)}` : ""}${filters.q ? `&title=${encodeURIComponent(filters.q)}` : ""}`

  return <Box sx={{ mt: 2 }}>
    {result.threads.length ? <Typography sx={{ fontSize: 13.5, color: "brand.navySoft", mb: 1 }} aria-live="polite">
      {plural(result.count, filters.kind ? KIND_LABELS[filters.kind].toLowerCase() : "thread")}
      {peptide ? ` about ${peptide.name}` : ""}{filters.lot ? ` mentioning lot ${filters.lot}` : ""}
    </Typography> : null}
    {result.threads.length ? <Box>{result.threads.map(thread => <ThreadCard key={thread.id} thread={thread} showTopic={!topic} />)}</Box>
      : narrowed ? <Box aria-live="polite" sx={{ py: 5, px: 3, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: "10px" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 650 }}>{filters.q ? `No threads match “${filters.q}”` : filters.lot ? `No reports on lot ${filters.lot} yet` : "No threads match these filters"}</Typography>
        <Typography sx={{ mt: 1, color: "brand.navySoft", maxWidth: 480, mx: "auto" }}>Try a shorter search or clear a filter. If nobody has asked yet, you can be the first.</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, mt: 2.5 }}>
          <ButtonLink href={composeHref} variant="contained">{filters.q ? "Ask this question" : "Start a thread"}</ButtonLink>
          <ButtonLink href={topic ? `/community?topic=${topic.id}` : "/community"} variant="outlined">Clear filters</ButtonLink>
        </Box>
      </Box>
      : <Box sx={{ p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", borderRadius: "12px", bgcolor: "brand.paper" }}>
        <Typography component="h3" sx={{ fontSize: { xs: 19, md: 21 }, fontWeight: 650, letterSpacing: "-.01em" }}>
          {topic ? `Start the first thread in ${topic.name}` : empty ? "Be one of the first to post" : "Nothing here yet"}
        </Typography>
        <Typography sx={{ mt: .75, mb: 2.5, color: "brand.navySoft", lineHeight: 1.65, maxWidth: 620 }}>
          {topic ? "Questions people often have about this topic. Pick one to start with it filled in, or write your own." : "The community is just starting. Pick a question to ask, or write your own. Experts and members answer in the open."}
        </Typography>
        <StarterPrompts topic={topic} prompts={topic?.prompts ?? COMMUNITY_TOPICS[0].prompts} />
        <ButtonLink href={composeHref} variant="contained" sx={{ mt: 2.5 }}>Write your own</ButtonLink>
      </Box>}
    {pages > 1 ? <Box component="nav" aria-label="Pages" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", fontSize: 14 }}>
      {page > 1 ? <AppLink href={query(page - 1)} rel="prev">← Previous</AppLink> : <span />}
      <Typography component="span" sx={{ fontSize: 14, color: "brand.navySoft" }}>Page {page} of {pages}</Typography>
      {page < pages ? <AppLink href={query(page + 1)} rel="next">Next →</AppLink> : <span />}
    </Box> : null}
  </Box>
}
