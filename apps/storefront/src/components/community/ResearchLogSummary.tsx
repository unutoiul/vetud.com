import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { Pill } from "./Badges"
import { changeFrom, formatChange, formatValue, isMetricId, METRICS, type MetricId, type UnitSystem } from "@/lib/community/metrics"
import type { ForumMeasurement } from "@/lib/community/types"

type Series = { metric: MetricId; points: { week: number; value: number }[] }

export function groupMeasurements(measurements: ForumMeasurement[]): Series[] {
  const byMetric = new Map<MetricId, { week: number; value: number }[]>()
  for (const { metric, week, value } of measurements) {
    if (!isMetricId(metric)) continue
    byMetric.set(metric, [...(byMetric.get(metric) ?? []), { week, value }])
  }
  return [...byMetric].map(([metric, points]) => ({ metric, points: points.sort((a, b) => a.week - b.week) }))
}

/** A tiny trend line; the table next to it carries the numbers. */
function Sparkline({ points }: { points: { week: number; value: number }[] }) {
  if (points.length < 2) return null
  const width = 120
  const height = 32
  const weeks = points.map(point => point.week)
  const values = points.map(point => point.value)
  const [minWeek, maxWeek] = [Math.min(...weeks), Math.max(...weeks)]
  const [minValue, maxValue] = [Math.min(...values), Math.max(...values)]
  const x = (week: number) => 3 + ((week - minWeek) / Math.max(1, maxWeek - minWeek)) * (width - 6)
  const y = (value: number) => maxValue === minValue ? height / 2 : 3 + (1 - (value - minValue) / (maxValue - minValue)) * (height - 6)
  const line = points.map(point => `${x(point.week).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ")
  return <Box component="svg" aria-hidden viewBox={`0 0 ${width} ${height}`} sx={{ width, height, display: "block", overflow: "visible" }}>
    <polyline points={line} fill="none" stroke="#3268aa" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    {points.map(point => <circle key={point.week} cx={x(point.week)} cy={y(point.value)} r="2.5" fill="#fff" stroke="#3268aa" strokeWidth="1.5" />)}
  </Box>
}

/** The structured part of a research log: start, latest and change for each measurement. */
export default function ResearchLogSummary({ measurements, units, sideEffects, author }: {
  measurements: ForumMeasurement[]; units: UnitSystem; sideEffects: string[]; author: string
}) {
  const series = groupMeasurements(measurements)
  const weeks = Math.max(0, ...measurements.map(measurement => measurement.week))
  return <Box component="section" aria-label="Research log measurements" sx={{ border: "1px solid", borderColor: "divider", borderRadius: "10px", bgcolor: "#fff", overflow: "hidden" }}>
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2, bgcolor: "brand.mintWash", borderBottom: "1px solid", borderColor: "divider", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 1 }}>
      <Typography sx={{ fontWeight: 700, color: "brand.navy" }}>Measurements</Typography>
      <Typography sx={{ fontSize: 14, color: "brand.navySoft" }}>{weeks ? `Tracked for ${weeks} ${weeks === 1 ? "week" : "weeks"}` : "Starting point logged"}</Typography>
    </Box>
    <Box sx={{ overflowX: "auto" }}>
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", fontSize: 14, "& th, & td": { textAlign: "left", px: { xs: 2, md: 3 }, py: 1.5, borderBottom: "1px solid", borderColor: "divider", whiteSpace: "nowrap" }, "& th": { fontSize: 12.5, fontWeight: 600, color: "brand.navySoft" }, "& td.num": { fontVariantNumeric: "tabular-nums" }, "& tr:last-of-type td": { borderBottom: 0 } }}>
        <thead><tr><th scope="col">Measure</th><th scope="col">Start</th><th scope="col">Latest</th><th scope="col">Change</th><th scope="col">Trend</th></tr></thead>
        <tbody>{series.map(({ metric, points }) => {
          const start = points.find(point => point.week === 0)
          const latest = points[points.length - 1]
          const later = start && latest.week > 0
          return <tr key={metric}>
            <th scope="row" style={{ color: "inherit", fontSize: 14, fontWeight: 650 }}>{METRICS[metric].label}</th>
            <td className="num">{start ? formatValue(metric, start.value, units) : "—"}</td>
            <td className="num">{later ? <>{formatValue(metric, latest.value, units)} <Box component="span" sx={{ color: "brand.navySoft" }}>· week {latest.week}</Box></> : "—"}</td>
            <td className="num" style={{ fontWeight: 650 }}>{later ? formatChange(METRICS[metric].change, changeFrom(metric, start.value, latest.value)) : "—"}</td>
            <td><Sparkline points={points} /></td>
          </tr>
        })}</tbody>
      </Box>
    </Box>
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
      {sideEffects.length ? <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: .75, mb: 1.25 }}>
        <Typography component="span" sx={{ fontSize: 13.5, fontWeight: 650, mr: .5 }}>Side effects noted:</Typography>
        {sideEffects.map(effect => <Pill key={effect}>{effect}</Pill>)}
      </Box> : null}
      <Typography sx={{ fontSize: 13, color: "text.secondary", lineHeight: 1.6 }}>Self-reported by {author}. Not verified, not a clinical result, and not medical advice.</Typography>
    </Box>
  </Box>
}
