import { MedusaError } from "@medusajs/framework/utils"

/**
 * What a research log can measure. Values are stored in these canonical units; the storefront
 * converts pounds and inches before sending. Keep in sync with the storefront's
 * src/lib/community/metrics.ts.
 */
export const METRICS = {
  body_weight: { label: "Body weight", unit: "kg", change: "percent", min: 30, max: 350 },
  waist: { label: "Waist", unit: "cm", change: "percent", min: 40, max: 250 },
  resting_heart_rate: { label: "Resting heart rate", unit: "bpm", change: "points", min: 30, max: 200 },
  sleep_hours: { label: "Sleep", unit: "h", change: "points", min: 0, max: 16 },
  sleep_quality: { label: "Sleep quality", unit: "score", change: "points", min: 0, max: 10 },
  energy: { label: "Energy", unit: "score", change: "points", min: 0, max: 10 },
  appetite: { label: "Hunger", unit: "score", change: "points", min: 0, max: 10 },
  pain: { label: "Pain", unit: "score", change: "points", min: 0, max: 10 },
  mobility: { label: "Mobility", unit: "score", change: "points", min: 0, max: 10 },
  stress: { label: "Stress", unit: "score", change: "points", min: 0, max: 10 },
  focus: { label: "Focus", unit: "score", change: "points", min: 0, max: 10 },
  skin: { label: "Skin condition", unit: "score", change: "points", min: 0, max: 10 },
} as const

export type MetricId = keyof typeof METRICS

export const METRIC_IDS = Object.keys(METRICS) as MetricId[]

/** Logs run for up to two years of weekly check-ins. */
export const MAX_LOG_WEEK = 104

export function isMetricId(value: string): value is MetricId {
  return Object.prototype.hasOwnProperty.call(METRICS, value)
}

export function isValidMeasurement(metric: MetricId, value: number) {
  const { min, max } = METRICS[metric]
  return Number.isFinite(value) && value >= min && value <= max
}

export type MeasurementInput = { metric: string; week: number; value: number }

export const MAX_MEASUREMENTS = 40

/**
 * Checks a research log's measurements and rounds values to two decimals. With `requireBaseline`
 * (a new log), every measured metric needs a week-0 value to compare against.
 */
export function validateMeasurements(measurements: MeasurementInput[], { requireBaseline }: { requireBaseline: boolean }) {
  if (measurements.length > MAX_MEASUREMENTS) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "That's too many measurements for one entry.")
  }
  const seen = new Set<string>()
  const normalized = measurements.map(({ metric, week, value }) => {
    if (!isMetricId(metric)) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Unknown measurement.")
    if (!Number.isInteger(week) || week < 0 || week > MAX_LOG_WEEK) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Weeks run from 0 (your starting point) to ${MAX_LOG_WEEK}.`)
    }
    if (!isValidMeasurement(metric, value)) {
      const { label, min, max, unit } = METRICS[metric]
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `${label} must be between ${min} and ${max}${unit === "score" ? "" : ` ${unit}`}.`)
    }
    const key = `${metric}:${week}`
    if (seen.has(key)) throw new MedusaError(MedusaError.Types.INVALID_DATA, `${METRICS[metric].label} appears twice for week ${week}.`)
    seen.add(key)
    return { metric, week, value: Math.round(value * 100) / 100 }
  })
  if (requireBaseline) {
    if (!normalized.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Add at least one starting measurement to your log.")
    }
    const missing = normalized.find(entry => !normalized.some(other => other.metric === entry.metric && other.week === 0))
    if (missing) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Add a starting value (week 0) for ${METRICS[missing.metric].label.toLowerCase()}.`)
    }
  }
  return normalized
}
