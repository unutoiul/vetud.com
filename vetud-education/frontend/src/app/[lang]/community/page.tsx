import { useContentTranslator } from "@/i18n/use-content-translator"
import { getContentTranslator } from "@/i18n/server-content"
import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"
import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { Suspense } from "react"
import Icon from "@/components/brand/Icon"
import { AppLink, ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import CommunityDisclaimer from "@/components/community/CommunityDisclaimer"
import ThreadCard from "@/components/community/ThreadCard"
import ThreadFilters from "@/components/community/ThreadFilters"
import { StarterPrompts, TopicGrid, TopicNav } from "@/components/community/Topics"
import { getPeptide } from "@/content/learn/peptides"
import { KIND_LABELS, THREAD_KINDS } from "@/lib/community/format"
import { communityMetadata } from "@/lib/community/seo"
import { COMMUNITY_TOPICS, getTopic, type CommunityTopic } from "@/lib/community/topics"
import type { ForumStats, ThreadFilters as Filters } from "@/lib/community/types"
import { getForumStats, listForumThreads } from "@/lib/medusa/forum"

type Params = Record<string, string | string[] | undefined>

export async function generateMetadata({ searchParams }: PageProps<"/[lang]/community">): Promise<Metadata> {
  const { topic: topicParam } = await searchParams
  const topic = getTopic(typeof topicParam === "string" ? topicParam : undefined)
  return topic
    ? communityMetadata({ path: `/community?topic=${topic.id}`, title: `${topic.name}: Peptide Research Questions and Discussions`, description: `${topic.description} Questions and discussions about the research, without doses.` })
    : communityMetadata({ path: "/community", title: "Peptide Research Community: Questions, Discussions and Expert Answers", description: "Questions answered by verified experts and open discussions about peptide research, by topic and without doses." })
}

const PAGE_SIZE = 20

export default function CommunityPage({ searchParams }: PageProps<"/[lang]/community">) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return <>
    <PageHeader eyebrow={ct("Community")} title={ct("Research, discussed in the open.")} description={ct("Ask questions and talk through the research with other members and verified experts, by topic. No doses, no hype.")}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <ButtonLink href="/community/new?kind=question" variant="contained" size="large">{act("askQuestion")}</ButtonLink>
        <ButtonLink href="/community/new?kind=discussion" variant="outlined" size="large">{act("startDiscussion")}</ButtonLink>
      </Box>
    </PageHeader>
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
  const q = value("q")?.trim().slice(0, 80) || undefined
  const page = Math.max(1, Math.min(500, Number.parseInt(value("page") ?? "1", 10) || 1))
  return { kind, sort, topic, peptides: peptide ? [peptide] : undefined, q, page }
}

/** Topics beside the feed; the topic cards on the front page; the thread list with its controls. */
async function Community({ searchParams }: Pick<PageProps<"/[lang]/community">, "searchParams">) {
  const ct = await getContentTranslator()
  const { page, ...filters } = readFilters(await searchParams)
  const stats = await getForumStats().catch(() => undefined)
  const topic = getTopic(filters.topic)
  const front = !topic && !filters.kind && !filters.peptides && !filters.q && filters.sort === "latest" && page === 1

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
      {front ? <Typography component="h2" sx={{ fontSize: { xs: 20, md: 22 }, fontWeight: 650, letterSpacing: "-.01em", mb: 1.5 }}>{ct("Latest threads")}</Typography> : null}
      <Suspense fallback={<Skeleton variant="rounded" height={112} />}><ThreadFilters /></Suspense>
      <ThreadList filters={filters} page={page} topic={topic} empty={!stats?.threads} />
      <Box sx={{ display: { xs: "block", lg: "none" }, mt: 5 }}><SideNotes /></Box>
    </Box>
  </Box>
}

function CommunityStats({ stats }: { stats: ForumStats }) {
  const ct = useContentTranslator()
  const items = [ct.count(stats.threads, "thread"), ct.count(stats.members, "member"), ...(stats.experts ? [ct.count(stats.experts, "verified expert")] : [])]
  return <Box component="ul" aria-label={ct("Community at a glance")} sx={{ listStyle: "none", m: 0, mb: 3, p: 0, display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: 1, fontSize: 14, color: "brand.navySoft", "& li strong": { color: "brand.navy", fontVariantNumeric: "tabular-nums" } }}>
    {items.map(item => <li key={item}>{item}</li>)}
  </Box>
}

function TopicHeader({ topic, threads }: { topic: CommunityTopic; threads: number }) {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return <Box component="header" sx={{ p: { xs: 2.5, md: 3.5 }, mb: 3, bgcolor: "brand.mintWash", border: "1px solid", borderColor: "brand.mint", borderRadius: "16px" }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
      <Box aria-hidden sx={{ width: 40, height: 40, flexShrink: 0, borderRadius: "11px", bgcolor: "background.paper", color: "brand.blue", display: "grid", placeItems: "center" }}><Icon name={topic.icon} sx={{ fontSize: 22 }} /></Box>
      <Typography sx={{ fontSize: 12, fontWeight: 650, letterSpacing: ".08em", textTransform: "uppercase", color: "brand.navySoft" }}>{ct("Community topic")}</Typography>
      <Typography component="span" sx={{ ml: "auto", flexShrink: 0, px: 1.25, py: .5, borderRadius: "999px", bgcolor: "background.paper", color: "brand.navySoft", fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{ct(ct.count(threads, "thread"))}</Typography>
    </Box>
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: { xs: 2.5, sm: 3 } }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="h2" sx={{ fontSize: { xs: 25, md: 30 }, fontWeight: 650, letterSpacing: "-.035em", lineHeight: 1.2, textWrap: "balance" }}>{ct(topic.name)}</Typography>
        <Typography sx={{ mt: 1, maxWidth: 580, fontSize: 14.5, color: "brand.navySoft", lineHeight: 1.7 }}>{ct(topic.description)}</Typography>
      </Box>
      <ButtonLink href={`/community/new?kind=question&topic=${topic.id}`} variant="contained" startIcon={<Icon name="plus" sx={{ fontSize: 18 }} />} sx={{ flexShrink: 0, minHeight: 48, borderRadius: "10px", whiteSpace: "nowrap", px: 2.5, "& .MuiButton-startIcon": { mr: 1 } }}>{act("askQuestion")}</ButtonLink>
    </Box>
  </Box>
}

/** How the community works, guidelines, and the invitation for experts. */
function SideNotes() {
  const ct = useContentTranslator()
  const act = useTranslations("Actions")
  return <Box sx={{ display: "grid", gap: 2 }}>
    <Box sx={{ p: 2.5, border: "1px solid", borderColor: "divider", borderRadius: "10px" }}>
      <Typography component="h2" sx={{ fontSize: 15, fontWeight: 650, color: "brand.navy" }}>{ct("Good threads here")}</Typography>
      <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.25, fontSize: 13.5, lineHeight: 1.65, color: "brand.navySoft", "& li": { mb: .5 } }}>
        <li>{ct("Ask one clear question, in the right topic.")}</li>
        <li>{ct("Link the study or source you mean.")}</li>
        <li>{ct("Leave out doses and personal protocols.")}</li>
        <li>{ct("Mark the most helpful answer as best.")}</li>
      </Box>
      <AppLink href="/community/guidelines" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 600 }}>{act("communityGuidelines")}</AppLink>
    </Box>
    <Box sx={{ p: 2.5, bgcolor: "brand.navy", color: "#fff", borderRadius: "10px" }}>
      <Icon name="shield" sx={{ fontSize: 22, color: "#abcce3" }} />
      <Typography component="h2" sx={{ mt: 1, fontSize: 15, fontWeight: 650 }}>{ct("Doctor or researcher?")}</Typography>
      <Typography sx={{ mt: .5, fontSize: 13.5, lineHeight: 1.6, color: "rgba(255,255,255,.8)" }}>{ct("Verified experts get a badge with their credentials, and their answers are pinned.")}</Typography>
      <AppLink href="/community/apply" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 650, color: "#fff", textDecorationColor: "rgba(255,255,255,.5)" }}>{act("applyVerified")}</AppLink>
    </Box>
  </Box>
}

async function ThreadList({ filters, page, topic, empty }: { filters: Filters; page: number; topic?: CommunityTopic; empty: boolean }) {
  const ct = await getContentTranslator()
  const act = await getTranslations("Actions")
  let result
  try {
    result = await listForumThreads({ ...filters, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
  } catch {
    return <Alert severity="error" sx={{ mt: 3 }}>{ct("We couldn't load the community right now. Please try again in a moment.")}</Alert>
  }
  const pages = Math.max(1, Math.ceil(result.count / PAGE_SIZE))
  const query = (target: number) => {
    const next = new URLSearchParams()
    if (filters.topic) next.set("topic", filters.topic)
    if (filters.kind) next.set("kind", filters.kind)
    if (filters.sort && filters.sort !== "latest") next.set("sort", filters.sort)
    if (filters.peptides?.[0]) next.set("peptide", filters.peptides[0])
    if (filters.q) next.set("q", filters.q)
    if (target > 1) next.set("page", String(target))
    const text = next.toString()
    return `/community${text ? `?${text}` : ""}`
  }
  const peptide = filters.peptides?.[0] ? getPeptide(filters.peptides[0]) : undefined
  const narrowed = Boolean(filters.kind || filters.peptides || filters.q || filters.sort === "unanswered")
  const composeHref = `/community/new?kind=${filters.kind ?? "question"}${topic ? `&topic=${topic.id}` : ""}${peptide ? `&peptide=${peptide.slug}` : ""}${filters.q ? `&title=${encodeURIComponent(filters.q)}` : ""}`

  return <Box sx={{ mt: 2 }}>
    {result.threads.length ? <Typography sx={{ fontSize: 13.5, color: "brand.navySoft", mb: 1 }} aria-live="polite">
      {ct(ct.count(result.count, filters.kind ? KIND_LABELS[filters.kind].toLowerCase() : "thread"))}
      {ct(peptide ? ` about ${peptide.name}` : "")}
    </Typography> : null}
    {result.threads.length ? <Box>{result.threads.map(thread => <ThreadCard key={thread.id} thread={thread} showTopic={!topic} />)}</Box>
      : narrowed ? <Box aria-live="polite" sx={{ py: 5, px: 3, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: "10px" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 650 }}>{filters.q ? `No threads match “${filters.q}”` : "No threads match these filters"}</Typography>
        <Typography sx={{ mt: 1, color: "brand.navySoft", maxWidth: 480, mx: "auto" }}>{ct("Try a shorter search or clear a filter. If nobody has asked yet, you can be the first.")}</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1.5, mt: 2.5 }}>
          <ButtonLink href={composeHref} variant="contained">{ct(filters.q ? act("askThis") : act("startThread"))}</ButtonLink>
          <ButtonLink href={topic ? `/community?topic=${topic.id}` : "/community"} variant="outlined">{act("clearFilters")}</ButtonLink>
        </Box>
      </Box>
      : <Box sx={{ p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", borderRadius: "12px", bgcolor: "brand.paper" }}>
        <Typography component="h3" sx={{ fontSize: { xs: 19, md: 21 }, fontWeight: 650, letterSpacing: "-.01em" }}>
          {ct(topic ? `Start the first thread in ${topic.name}` : empty ? "Be one of the first to post" : "Nothing here yet")}
        </Typography>
        <Typography sx={{ mt: .75, mb: 2.5, color: "brand.navySoft", lineHeight: 1.65, maxWidth: 620 }}>
          {ct(topic ? "Questions people often have about this topic. Pick one to start with it filled in, or write your own." : "The community is just starting. Pick a question to ask, or write your own. Experts and members answer in the open.")}
        </Typography>
        <StarterPrompts topic={topic} prompts={topic?.prompts ?? COMMUNITY_TOPICS[0].prompts} />
        <ButtonLink href={composeHref} variant="contained" sx={{ mt: 2.5 }}>{act("writeOwn")}</ButtonLink>
      </Box>}
    {pages > 1 ? <Box component="nav" aria-label={act("pages")} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", fontSize: 14 }}>
      {page > 1 ? <AppLink href={query(page - 1)} rel="prev">{act("previous")}</AppLink> : <span />}
      <Typography component="span" sx={{ fontSize: 14, color: "brand.navySoft" }}>{ct.rich("Page {v0} of {v1}", { v0: ct(page), v1: ct(pages) }, {  })}</Typography>
      {page < pages ? <AppLink href={query(page + 1)} rel="next">{act("next")}</AppLink> : <span />}
    </Box> : null}
  </Box>
}
