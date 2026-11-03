import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { AppLink, ButtonLink } from "../common/links"
import CommunityInsightChart from "./CommunityInsightChart"
import ThreadCard from "./ThreadCard"
import { WEIGHT_LOSS_TRIALS } from "@/content/learn/weight-loss-trials"
import type { PeptideProfile } from "@/content/learn/peptides"
import { plural } from "@/lib/community/format"
import { getPeptideInsights, listForumThreads } from "@/lib/medusa/forum"

/**
 * The community section of a peptide profile: the members' chart once enough research logs
 * exist, and the latest threads about it. Renders nothing extra if the community is unreachable.
 */
export default async function PeptideCommunity({ peptide }: { peptide: PeptideProfile }) {
  const [insights, threads] = await Promise.all([
    getPeptideInsights(peptide.slug).catch(() => null),
    listForumThreads({ peptides: [peptide.slug], limit: 3 }).catch(() => null),
  ])
  const trials = WEIGHT_LOSS_TRIALS.filter(trial => trial.peptide === peptide.slug)
  const needed = insights ? Math.max(0, insights.min_logs - insights.logs) : 0

  return <Box>
    {insights?.insights.length ? <CommunityInsightChart peptideName={peptide.name} insights={insights.insights} logs={insights.logs} trials={trials} /> : (
      <Box sx={{ p: { xs: 2.5, md: 3 }, bgcolor: "brand.mintWash", borderRadius: "10px" }}>
        <Typography sx={{ fontSize: 16, lineHeight: 1.75, color: "brand.navySoft" }}>
          {insights?.logs
            ? <>{plural(insights.logs, "member has", "members have")} logged {peptide.name} so far. The community chart appears once at least {insights.min_logs} members have logged the same measure{needed ? `; ${plural(needed, "more log")} to go` : ""}.</>
            : <>No research logs for {peptide.name} yet. Members log measurements (never doses), and once enough logs exist they add up into a chart here, next to the published research.</>}
        </Typography>
        <ButtonLink href={`/community/new?kind=research_log&peptide=${peptide.slug}`} variant="contained" sx={{ mt: 2 }}>Start a research log</ButtonLink>
      </Box>
    )}
    {threads?.threads.length ? <Box sx={{ mt: 3 }}>
      <Typography component="h3" sx={{ fontSize: 18, fontWeight: 650, mb: .5 }}>Latest from the community</Typography>
      {threads.threads.map(thread => <ThreadCard key={thread.id} thread={thread} />)}
      <AppLink href={`/community?peptide=${peptide.slug}`} sx={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontSize: 15 }}>
        {threads.count > threads.threads.length ? `See all ${threads.count} threads about ${peptide.name}` : `Discuss ${peptide.name} in the community`}
      </AppLink>
    </Box> : null}
  </Box>
}
