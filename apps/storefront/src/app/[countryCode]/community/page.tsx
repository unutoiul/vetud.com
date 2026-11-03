import Alert from "@mui/material/Alert"
import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import { Suspense } from "react"
import Icon, { type IconName } from "@/components/brand/Icon"
import { AppLink, ButtonLink } from "@/components/common/links"
import PageHeader from "@/components/common/PageHeader"
import Section from "@/components/common/Section"
import CommunityDisclaimer from "@/components/community/CommunityDisclaimer"
import ThreadCard from "@/components/community/ThreadCard"
import ThreadFilters from "@/components/community/ThreadFilters"
import { getPeptide } from "@/content/learn/peptides"
import { KIND_LABELS, plural, THREAD_KINDS } from "@/lib/community/format"
import { communityMetadata } from "@/lib/community/seo"
import type { ThreadFilters as Filters } from "@/lib/community/types"
import { getForumStats, listForumThreads } from "@/lib/medusa/forum"

export const metadata = communityMetadata({
  path: "/community",
  title: "Peptide Research Community: Questions, Discussions and Expert Answers",
  description: "Questions answered by verified experts and open discussions about peptide research, without doses.",
})

const PAGE_SIZE = 20

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "eye", title: "Photos with your posts", text: "Add up to four photos to a question, discussion or reply. Location data is removed before they're shown." },
  { icon: "shield", title: "Expert answers", text: "Doctors and researchers verified by our team answer questions. Their replies are badged and pinned." },
  { icon: "checkCircle", title: "Reputation that means something", text: "Helpful votes and best answers build each member's level, so useful voices are easy to find." },
]

export default function CommunityPage({ searchParams }: PageProps<"/[countryCode]/community">) {
  return <>
    <PageHeader eyebrow="Community" title="Research, discussed in the open." description="Members ask questions and discuss the research. No doses, no hype: sources and answers from verified experts.">
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
        <ButtonLink href="/community/new" variant="contained" size="large">Start a thread</ButtonLink>
        <ButtonLink href="/community/new?kind=question" variant="outlined" size="large">Ask a question</ButtonLink>
      </Box>
    </PageHeader>
    <Section tone="white" sx={{ py: { xs: 4, md: 6 } }}>
      <Suspense fallback={<Skeleton variant="rounded" height={56} sx={{ mb: 4 }} />}><CommunityStats /></Suspense>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" }, gap: { xs: 5, lg: 6 }, alignItems: "start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Suspense fallback={<Skeleton variant="rounded" height={112} />}><ThreadFilters /></Suspense>
          <Suspense fallback={<Box sx={{ display: "grid", gap: 2, mt: 2 }}>{[0, 1, 2, 3].map(key => <Skeleton key={key} variant="rounded" height={120} />)}</Box>}>
            <ThreadList searchParams={searchParams} />
          </Suspense>
        </Box>
        <Box component="aside" aria-label="About the community" sx={{ display: "grid", gap: 2.5, position: { lg: "sticky" }, top: { lg: 112 } }}>
          {FEATURES.map(feature => <Box key={feature.title} sx={{ display: "grid", gridTemplateColumns: "36px 1fr", gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "brand.mintWash", color: "brand.blue", display: "grid", placeItems: "center" }}><Icon name={feature.icon} sx={{ fontSize: 20 }} /></Box>
            <Box>
              <Typography component="h2" sx={{ fontSize: 15, fontWeight: 700, color: "brand.navy" }}>{feature.title}</Typography>
              <Typography sx={{ mt: .25, fontSize: 14, lineHeight: 1.6, color: "brand.navySoft" }}>{feature.text}</Typography>
            </Box>
          </Box>)}
          <Box sx={{ p: 2.5, bgcolor: "brand.mintWash", borderRadius: "10px" }}>
            <Typography sx={{ fontSize: 14, lineHeight: 1.65, color: "brand.navySoft" }}>Posts with dose amounts wait for a moderator, and three reports hide a post until it&apos;s reviewed.</Typography>
            <AppLink href="/community/guidelines" sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 14, fontWeight: 600 }}>Read the community guidelines</AppLink>
          </Box>
        </Box>
      </Box>
      <CommunityDisclaimer sx={{ mt: { xs: 6, md: 8 }, pt: 3, borderTop: "1px solid", borderColor: "divider" }} />
    </Section>
  </>
}

async function CommunityStats() {
  let stats
  try {
    stats = await getForumStats()
  } catch {
    return null
  }
  const items = [plural(stats.threads, "thread"), plural(stats.members, "member"), plural(stats.experts, "verified expert")]
  return <Box component="ul" aria-label="Community at a glance" sx={{ listStyle: "none", m: 0, mb: { xs: 3, md: 4 }, p: 0, display: "flex", flexWrap: "wrap", columnGap: 3, rowGap: 1, fontSize: 14, color: "brand.navySoft", "& li strong": { color: "brand.navy", fontVariantNumeric: "tabular-nums" } }}>
    {items.map(item => { const [count, ...words] = item.split(" "); return <li key={item}><strong>{count}</strong> {words.join(" ")}</li> })}
  </Box>
}

function readFilters(params: Record<string, string | string[] | undefined>): Filters & { page: number } {
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : undefined
  const kind = THREAD_KINDS.find(entry => entry === value("kind"))
  const sort = value("sort") === "top" || value("sort") === "unanswered" ? value("sort") as "top" | "unanswered" : "latest"
  const peptide = getPeptide(value("peptide") ?? "")?.slug
  const lot = value("lot")?.trim().toUpperCase().slice(0, 40) || undefined
  const q = value("q")?.trim().slice(0, 80) || undefined
  const page = Math.max(1, Math.min(500, Number.parseInt(value("page") ?? "1", 10) || 1))
  return { kind, sort, peptides: peptide ? [peptide] : undefined, lot: lot && /^[A-Z0-9][A-Z0-9 _./-]{2,}$/.test(lot) ? lot : undefined, q, page }
}

async function ThreadList({ searchParams }: Pick<PageProps<"/[countryCode]/community">, "searchParams">) {
  const { page, ...filters } = readFilters(await searchParams)
  let result
  try {
    result = await listForumThreads({ ...filters, offset: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE })
  } catch {
    return <Alert severity="error" sx={{ mt: 3 }}>We couldn&apos;t load the community right now. Please try again in a moment.</Alert>
  }
  const pages = Math.max(1, Math.ceil(result.count / PAGE_SIZE))
  const query = (target: number) => {
    const next = new URLSearchParams()
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

  return <Box sx={{ mt: 2 }}>
    <Typography sx={{ fontSize: 14, color: "brand.navySoft", mb: 1 }} aria-live="polite">
      {plural(result.count, filters.kind ? KIND_LABELS[filters.kind].toLowerCase() : "thread")}
      {peptide ? ` about ${peptide.name}` : ""}{filters.lot ? ` mentioning lot ${filters.lot}` : ""}
    </Typography>
    {result.threads.length ? <Box>{result.threads.map(thread => <ThreadCard key={thread.id} thread={thread} />)}</Box> : <Box sx={{ py: 6, px: 3, textAlign: "center", border: "1px dashed", borderColor: "divider", borderRadius: "10px" }}>
      <Typography sx={{ fontSize: 18, fontWeight: 650 }}>Nothing here yet</Typography>
      <Typography sx={{ mt: 1, color: "brand.navySoft" }}>{filters.lot ? "No member has reported on this lot yet." : "Be the first to start the conversation."}</Typography>
      <ButtonLink href={`/community/new${peptide ? `?peptide=${peptide.slug}` : filters.lot ? `?lot=${encodeURIComponent(filters.lot)}` : ""}`} variant="contained" sx={{ mt: 2.5 }}>Start a thread</ButtonLink>
    </Box>}
    {pages > 1 ? <Box component="nav" aria-label="Pages" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", fontSize: 14 }}>
      {page > 1 ? <AppLink href={query(page - 1)} rel="prev">← Previous</AppLink> : <span />}
      <Typography component="span" sx={{ fontSize: 14, color: "brand.navySoft" }}>Page {page} of {pages}</Typography>
      {page < pages ? <AppLink href={query(page + 1)} rel="next">Next →</AppLink> : <span />}
    </Box> : null}
  </Box>
}
