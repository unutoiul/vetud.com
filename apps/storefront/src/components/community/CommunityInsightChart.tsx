import Box from "@mui/material/Box"
import Tooltip from "@mui/material/Tooltip"
import Typography from "@mui/material/Typography"
import { formatChange, isMetricId, METRICS } from "@/lib/community/metrics"
import { plural } from "@/lib/community/format"
import type { MetricInsight } from "@/lib/community/types"
import type { WeightLossTrial } from "@/content/learn/weight-loss-trials"

// Members in the brand blue; the middle half of logs as a light band behind the median bar.
const MEMBER = "#3268aa"
const BAND = "#dce9f7"
const TRIAL = "#15265e"
const PLACEBO = "#8794a8"

/** A symmetric scale around zero, rounded up to a readable step. */
function domainFor(insight: MetricInsight) {
  const extent = Math.max(Math.abs(insight.p25), Math.abs(insight.p75), Math.abs(insight.median))
  const step = insight.change === "percent" ? 5 : 1
  return Math.max(insight.change === "percent" ? 10 : 3, Math.ceil(extent / step) * step)
}

function InsightRow({ insight }: { insight: MetricInsight }) {
  if (!isMetricId(insight.metric)) return null
  const metric = METRICS[insight.metric]
  const domain = domainFor(insight)
  const position = (value: number) => `${50 + (value / domain) * 50}%`
  const median = formatChange(insight.change, insight.median)
  const description = `${metric.label}: median ${median} across ${plural(insight.logs, "log")}, after a median ${insight.median_weeks} weeks. The middle half of logs reported ${formatChange(insight.change, insight.p25)} to ${formatChange(insight.change, insight.p75)}.`
  return <Box sx={{ display: "contents" }}>
    <Box sx={{ pt: { xs: 2.5, md: 2 }, pb: { md: 2 }, borderTop: { md: "1px solid" }, borderColor: { md: "divider" } }}>
      <Typography sx={{ fontWeight: 650, fontSize: 15 }}>{metric.label} <Box component="span" sx={{ color: MEMBER, fontVariantNumeric: "tabular-nums" }}>{median}</Box></Typography>
      <Typography sx={{ fontSize: 12.5, color: "text.secondary", lineHeight: 1.5 }}>
        {plural(insight.logs, "log")} · median {insight.median_weeks} weeks{insight.stacked ? <><br />{insight.stacked} combined with other peptides</> : null}
      </Typography>
    </Box>
    <Box sx={{ py: { xs: 1, md: 2 }, borderTop: { md: "1px solid" }, borderColor: { md: "divider" }, display: "grid", alignContent: "center" }}>
      <Tooltip arrow placement="top" title={<Box sx={{ py: .25, fontSize: 12.5 }}><Box component="strong" sx={{ display: "block", fontSize: 14 }}>Median {median}</Box>Middle half: {formatChange(insight.change, insight.p25)} to {formatChange(insight.change, insight.p75)}</Box>}>
        <Box tabIndex={0} aria-label={description} sx={{ position: "relative", height: 26, mr: { xs: 0, md: 6 }, borderRadius: "4px", "&:focus-visible": { outline: "2px solid", outlineColor: "brand.blue", outlineOffset: 2 } }}>
          <Box aria-hidden sx={{ position: "absolute", top: 0, bottom: 0, left: "50%", borderLeft: "1px solid #94a3b8" }} />
          <Box aria-hidden sx={{ position: "absolute", top: 4, height: 18, left: position(Math.min(insight.p25, insight.p75)), right: `calc(100% - ${position(Math.max(insight.p25, insight.p75))})`, bgcolor: BAND, borderRadius: "3px" }} />
          <Box aria-hidden sx={{ position: "absolute", top: 8, height: 10, left: position(Math.min(0, insight.median)), right: `calc(100% - ${position(Math.max(0, insight.median))})`, bgcolor: MEMBER, borderRadius: "2px" }} />
        </Box>
      </Tooltip>
      <Box aria-hidden sx={{ display: "flex", justifyContent: "space-between", mr: { xs: 0, md: 6 }, mt: .5, fontSize: 11.5, color: "#67758b", fontVariantNumeric: "tabular-nums" }}>
        <span>{formatChange(insight.change, -domain)}</span><span>0</span><span>{formatChange(insight.change, domain)}</span>
      </Box>
    </Box>
  </Box>
}

/** Members' median weight change next to the published trials of the same medicine. */
function TrialComparison({ insight, trials }: { insight: MetricInsight; trials: WeightLossTrial[] }) {
  const memberLoss = -insight.median
  const scale = Math.max(30, Math.ceil(Math.max(memberLoss, ...trials.map(trial => trial.medicineLoss)) / 10) * 10)
  const bar = (value: number, color: string, outlined = false) => <Box sx={{ display: "flex", alignItems: "center", height: 22 }}>
    <Box sx={{ height: 16, width: `${(Math.max(0, value) / scale) * 100}%`, bgcolor: outlined ? "transparent" : color, border: outlined ? `2px solid ${color}` : 0, backgroundImage: outlined ? `repeating-linear-gradient(135deg, ${BAND} 0 4px, transparent 4px 8px)` : "none", borderRadius: "0 4px 4px 0" }} />
    <Typography component="span" sx={{ ml: 1, fontSize: 12.5, fontWeight: 650, fontVariantNumeric: "tabular-nums" }}>{value.toFixed(1)}%</Typography>
  </Box>
  return <Box component="section" aria-label="Members compared with published trials" sx={{ mt: 3, pt: 3, borderTop: "1px solid", borderColor: "divider" }}>
    <Typography component="h3" sx={{ fontSize: 18, fontWeight: 650 }}>Next to the published trials</Typography>
    <Typography sx={{ mt: .5, mb: 2, fontSize: 13.5, color: "text.secondary", lineHeight: 1.7, maxWidth: 760 }}>Average body weight lost in each trial, and the members&apos; median. Trials ran much longer, under medical supervision, with weights measured by clinicians; member logs are shorter and self-reported, so the bars are not a like-for-like comparison.</Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 280px) 1fr" }, columnGap: 3, rowGap: 1.5 }}>
      {trials.map(trial => <Box key={`${trial.trial}-${trial.medicine}`} sx={{ display: "contents" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 650 }}>{trial.trial} <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>· {trial.weeks} weeks · {trial.people.toLocaleString("en-US")} people</Box></Typography>
        <Box sx={{ mr: { md: 6 } }}>{bar(trial.medicineLoss, TRIAL)}{bar(trial.placeboLoss, PLACEBO)}</Box>
      </Box>)}
      <Typography sx={{ fontSize: 14, fontWeight: 650 }}>Vetud members <Box component="span" sx={{ fontWeight: 400, color: "text.secondary" }}>· median {insight.median_weeks} weeks · {plural(insight.logs, "log")}</Box></Typography>
      <Box sx={{ mr: { md: 6 } }}>{bar(memberLoss, MEMBER, true)}</Box>
    </Box>
    <Box component="ul" aria-label="Legend" sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, listStyle: "none", m: 0, mt: 2, p: 0 }}>
      {[["Medicine in trial", TRIAL, false], ["Placebo in trial", PLACEBO, false], ["Members (self-reported)", MEMBER, true]].map(([label, color, outlined]) => <Box component="li" key={String(label)} sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, color: "text.secondary" }}>
        <Box component="span" sx={{ width: 14, height: 14, borderRadius: "3px", bgcolor: outlined ? "transparent" : String(color), border: outlined ? `2px solid ${color}` : 0 }} />{label}
      </Box>)}
    </Box>
  </Box>
}

/**
 * "What members report": medians from published research logs, shown only for measures with
 * enough logs. Optionally compared with the weight-loss trials of the same peptide.
 */
export default function CommunityInsightChart({ peptideName, insights, logs, trials = [] }: {
  peptideName: string; insights: MetricInsight[]; logs: number; trials?: WeightLossTrial[]
}) {
  const weight = insights.find(insight => insight.metric === "body_weight")
  return <Box component="figure" sx={{ m: 0, minWidth: 0, bgcolor: "#fff", border: "1px solid", borderColor: "divider", borderRadius: "10px", p: { xs: 2.5, md: 4 } }}>
    <Typography component="figcaption" sx={{ fontSize: { xs: 19, md: 22 }, fontWeight: 650, letterSpacing: "-.02em" }}>{peptideName}: what members report</Typography>
    <Typography sx={{ fontSize: 13.5, color: "text.secondary", mt: .5, mb: 2, lineHeight: 1.7, maxWidth: 820 }}>
      Median change from each member&apos;s starting point, from {plural(logs, "published research log")}. The bar is the median; the light band holds the middle half of logs.
    </Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 280px) 1fr" }, columnGap: 3 }}>
      {insights.map(insight => <InsightRow key={insight.metric} insight={insight} />)}
    </Box>
    {weight && trials.length ? <TrialComparison insight={weight} trials={trials} /> : null}

    <Box component="details" sx={{ mt: 2.5, "& summary": { cursor: "pointer", fontSize: 13.5, fontWeight: 600, color: "brand.blue", minHeight: 44, display: "flex", alignItems: "center" } }}>
      <summary>Show these numbers as a table</summary>
      <Box sx={{ overflowX: "auto", mt: 1 }}>
        <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, "& th, & td": { textAlign: "left", p: 1.25, borderBottom: "1px solid", borderColor: "divider", whiteSpace: "nowrap" }, "& .num": { textAlign: "right", fontVariantNumeric: "tabular-nums" } }}>
          <thead><tr><th>Measure</th><th className="num">Logs</th><th className="num">Median</th><th className="num">Middle half</th><th className="num">Median weeks</th><th>By week</th></tr></thead>
          <tbody>{insights.filter(insight => isMetricId(insight.metric)).map(insight => <tr key={insight.metric}>
            <td>{METRICS[insight.metric as keyof typeof METRICS].label}</td>
            <td className="num">{insight.logs}</td>
            <td className="num">{formatChange(insight.change, insight.median)}</td>
            <td className="num">{formatChange(insight.change, insight.p25)} to {formatChange(insight.change, insight.p75)}</td>
            <td className="num">{insight.median_weeks}</td>
            <td>{insight.curve.length ? insight.curve.map(point => `week ${point.week}: ${formatChange(insight.change, point.median)} (${point.logs})`).join(" · ") : "—"}</td>
          </tr>)}</tbody>
        </Box>
      </Box>
    </Box>
    <Typography sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider", fontSize: 13, color: "text.secondary", lineHeight: 1.7 }}>
      Self-reported by community members and not verified. Members choose what to track, people who see a change may be more likely to post, and some logs combine several peptides. This is not a clinical result and not medical advice.
    </Typography>
  </Box>
}
