import { useTranslations } from "next-intl"
import Box from "@mui/material/Box"
import Skeleton from "@mui/material/Skeleton"
import Typography from "@mui/material/Typography"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { AppLink } from "@/components/common/links"
import Section from "@/components/common/Section"
import { Pill } from "@/components/community/Badges"
import CommunityDisclaimer from "@/components/community/CommunityDisclaimer"
import ThreadCard from "@/components/community/ThreadCard"
import { formatForumDate, plural } from "@/lib/community/format"
import { communityMetadata } from "@/lib/community/seo"
import { getForumMember } from "@/lib/medusa/forum"

const PLACEHOLDER = "__placeholder__"
const HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Member pages render on first visit; the placeholder only validates the route's static shell.
export function generateStaticParams() {
  return [{ handle: PLACEHOLDER }]
}

async function load(handle: string) {
  if (!HANDLE.test(handle)) return null
  try {
    return await getForumMember(handle)
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps<"/[countryCode]/community/members/[handle]">): Promise<Metadata> {
  const { handle } = await params
  const page = await load(handle)
  if (!page) return { title: "Community member", robots: { index: false, follow: true } }
  return communityMetadata({ title: `${page.member.display_name} in the Vetud community`, description: `${page.member.level} · ${plural(page.totals.threads, "thread")} and ${plural(page.totals.replies, "reply", "replies")}.`, path: `/community/members/${handle}`, index: page.totals.threads > 0 })
}

export default function MemberPage({ params }: PageProps<"/[countryCode]/community/members/[handle]">) {
  const act = useTranslations("Actions")
  return <Section tone="white" sx={{ py: { xs: 4, md: 6 } }}>
    <Box sx={{ maxWidth: 880, mx: "auto" }}>
      <Box component="nav" aria-label={act("breadcrumb")} sx={{ fontSize: 14, mb: 2 }}><AppLink href="/community">{act("community")}</AppLink></Box>
      <Suspense fallback={<Skeleton variant="rounded" height={320} />}><MemberContent params={params} /></Suspense>
      <CommunityDisclaimer sx={{ mt: 6, pt: 3, borderTop: "1px solid", borderColor: "divider" }} />
    </Box>
  </Section>
}

async function MemberContent({ params }: Pick<PageProps<"/[countryCode]/community/members/[handle]">, "params">) {
  const { handle } = await params
  const page = await load(handle)
  if (!page) notFound()
  const { member, totals, threads } = page
  return <>
    <Box component="header" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "72px 1fr" }, gap: 2.5, alignItems: "center" }}>
      <Box aria-hidden sx={{ width: 72, height: 72, borderRadius: "50%", bgcolor: "brand.mintWash", color: "brand.blue", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 700 }}>{member.display_name.charAt(0).toUpperCase()}</Box>
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 30, md: 38 }, fontWeight: 500, letterSpacing: "-.03em", color: "brand.navy" }}>{member.display_name}</Typography>
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: .75, alignItems: "center" }}>
          {member.role === "expert" ? <Pill tone="expert" icon="shield">Expert{member.credentials ? ` · ${member.credentials}` : ""}</Pill> : null}
          {member.role === "moderator" ? <Pill tone="moderator">Moderator</Pill> : null}
          <Pill>{member.level} · {plural(member.reputation, "point")}</Pill>
          <Typography component="span" sx={{ fontSize: 14, color: "brand.navySoft" }}>Joined {formatForumDate(member.joined_at)}</Typography>
        </Box>
      </Box>
    </Box>
    {member.bio ? <Typography sx={{ mt: 3, fontSize: 16, lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{member.bio}</Typography> : null}
    <Box component="dl" sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: { xs: 3, md: 5 }, "& dt": { fontSize: 13, color: "brand.navySoft" }, "& dd": { m: 0, fontSize: 26, fontWeight: 650, color: "brand.navy", fontVariantNumeric: "tabular-nums" } }}>
      <div><dt>Threads</dt><dd>{totals.threads}</dd></div>
      <div><dt>Replies</dt><dd>{totals.replies}</dd></div>
    </Box>
    <Typography component="h2" sx={{ mt: 5, mb: 1, fontSize: 22, fontWeight: 650 }}>Latest threads</Typography>
    {threads.length ? threads.map(thread => <ThreadCard key={thread.id} thread={thread} />) : <Typography sx={{ color: "brand.navySoft" }}>No threads yet.</Typography>}
  </>
}
