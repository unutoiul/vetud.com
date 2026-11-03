import { METRICS, isMetricId, type MetricId } from "./metrics"

/** Fewer logs than this and nothing is shown: small groups are noisy and could identify members. */
export const MIN_LOGS_FOR_INSIGHT = 5
/** A log counts once it has a measurement at least this many weeks after its baseline. */
export const MIN_WEEKS_FOR_INSIGHT = 4
export const WEEK_BUCKETS = [4, 8, 12, 16, 24, 52] as const

export type LogForInsight = {
  stacked: boolean
  measurements: { metric: string; week: number; value: number }[]
}

export type MetricInsight = {
  metric: MetricId
  change: "percent" | "points"
  logs: number
  stacked: number
  median: number
  p25: number
  p75: number
  median_weeks: number
  curve: { week: number; logs: number; median: number }[]
}

export function changeFrom(metric: MetricId, baseline: number, value: number) {
  if (METRICS[metric].change === "points") return value - baseline
  return baseline ? ((value - baseline) / baseline) * 100 : 0
}

/** Linear interpolation between closest ranks; `sorted` is ascending and non-empty. */
export function quantile(sorted: number[], q: number) {
  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower)
}

const round = (value: number) => Math.round(value * 10) / 10
const ascending = (values: number[]) => [...values].sort((a, b) => a - b)

type LogChange = { change: number; weeks: number; stacked: boolean; points: { week: number; change: number }[] }

/**
 * Adds up research logs for one peptide: each log's change from its baseline (week 0) to its
 * latest measurement at week 4 or later, per metric, plus medians at fixed week marks.
 * Metrics with fewer than MIN_LOGS_FOR_INSIGHT logs are left out.
 */
export function summarizeLogs(logs: LogForInsight[]): MetricInsight[] {
  const byMetric = new Map<MetricId, LogChange[]>()

  for (const log of logs) {
    const series = new Map<MetricId, { week: number; value: number }[]>()
    for (const measurement of log.measurements) {
      if (!isMetricId(measurement.metric)) continue
      series.set(measurement.metric, [...(series.get(measurement.metric) ?? []), measurement])
    }
    for (const [metric, values] of series) {
      const baseline = values.find(value => value.week === 0)
      const later = values.filter(value => value.week >= MIN_WEEKS_FOR_INSIGHT).sort((a, b) => b.week - a.week)
      if (!baseline || !later.length) continue
      byMetric.set(metric, [...(byMetric.get(metric) ?? []), {
        change: changeFrom(metric, baseline.value, later[0].value),
        weeks: later[0].week,
        stacked: log.stacked,
        points: values.filter(value => value.week > 0).map(value => ({ week: value.week, change: changeFrom(metric, baseline.value, value.value) })),
      }])
    }
  }

  const insights: MetricInsight[] = []
  for (const [metric, entries] of byMetric) {
    if (entries.length < MIN_LOGS_FOR_INSIGHT) continue
    const changes = ascending(entries.map(entry => entry.change))
    const curve = WEEK_BUCKETS.map((week, index) => {
      const after = index ? WEEK_BUCKETS[index - 1] : 0
      // Each log's latest value inside this window (after the previous mark, up to this one).
      const values = entries.flatMap(entry => {
        const inWindow = entry.points.filter(point => point.week > after && point.week <= week).sort((a, b) => b.week - a.week)
        return inWindow.length ? [inWindow[0].change] : []
      })
      return { week, logs: values.length, median: values.length ? round(quantile(ascending(values), 0.5)) : 0 }
    }).filter(point => point.logs >= MIN_LOGS_FOR_INSIGHT)

    insights.push({
      metric,
      change: METRICS[metric].change,
      logs: entries.length,
      stacked: entries.filter(entry => entry.stacked).length,
      median: round(quantile(changes, 0.5)),
      p25: round(quantile(changes, 0.25)),
      p75: round(quantile(changes, 0.75)),
      median_weeks: Math.round(quantile(ascending(entries.map(entry => entry.weeks)), 0.5)),
      curve,
    })
  }
  return insights.sort((a, b) => b.logs - a.logs || a.metric.localeCompare(b.metric))
}
