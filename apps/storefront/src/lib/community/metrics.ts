import type { CategoryId } from "@/content/learn/categories"

/**
 * What a research log can measure. Values travel in canonical units (kg, cm); the composer
 * converts pounds and inches. Keep in sync with apps/backend/src/lib/forum/metrics.ts.
 */
export const METRICS = {
  body_weight: { label: "Body weight", unit: "kg", imperial: "lb", change: "percent", min: 30, max: 350, hint: "" },
  waist: { label: "Waist", unit: "cm", imperial: "in", change: "percent", min: 40, max: 250, hint: "Measured at the navel" },
  resting_heart_rate: { label: "Resting heart rate", unit: "bpm", imperial: "bpm", change: "points", min: 30, max: 200, hint: "" },
  sleep_hours: { label: "Sleep", unit: "h", imperial: "h", change: "points", min: 0, max: 16, hint: "Average hours a night" },
  sleep_quality: { label: "Sleep quality", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = very poor, 10 = excellent" },
  energy: { label: "Energy", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = exhausted, 10 = full of energy" },
  appetite: { label: "Hunger", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = never hungry, 10 = always hungry" },
  pain: { label: "Pain", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = none, 10 = worst imaginable" },
  mobility: { label: "Mobility", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = very limited, 10 = full range" },
  stress: { label: "Stress", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = calm, 10 = extremely stressed" },
  focus: { label: "Focus", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = can't focus, 10 = sharp" },
  skin: { label: "Skin condition", unit: "score", imperial: "score", change: "points", min: 0, max: 10, hint: "0 = poor, 10 = excellent" },
} as const

export type MetricId = keyof typeof METRICS
export type UnitSystem = "metric" | "imperial"

export const METRIC_IDS = Object.keys(METRICS) as MetricId[]

export function isMetricId(value: string): value is MetricId {
  return Object.prototype.hasOwnProperty.call(METRICS, value)
}

/** The measurements suggested first for each library category. Members can add any other. */
export const CATEGORY_METRICS: Record<CategoryId, MetricId[]> = {
  weight: ["body_weight", "waist", "appetite", "energy"],
  skin: ["skin"],
  pigmentation: ["skin"],
  hair: ["skin"],
  recovery: ["pain", "mobility", "sleep_quality"],
  energy: ["energy", "sleep_quality", "body_weight"],
  growth: ["sleep_quality", "energy", "body_weight"],
  focus: ["focus", "stress", "sleep_quality"],
  calm: ["stress", "sleep_quality", "focus"],
  sleep: ["sleep_quality", "sleep_hours", "energy"],
  longevity: ["energy", "sleep_quality", "resting_heart_rate"],
  intimacy: ["energy", "stress"],
  fertility: ["energy", "sleep_quality"],
  immune: ["energy", "sleep_quality"],
  medicines: ["energy", "sleep_quality"],
}

const LB_PER_KG = 2.20462
const IN_PER_CM = 0.393701

/** Converts a value the member typed (in their unit system) to the canonical unit. */
export function toCanonical(metric: MetricId, value: number, system: UnitSystem) {
  if (system === "metric") return value
  if (METRICS[metric].unit === "kg") return value / LB_PER_KG
  if (METRICS[metric].unit === "cm") return value / IN_PER_CM
  return value
}

export function fromCanonical(metric: MetricId, value: number, system: UnitSystem) {
  if (system === "metric") return value
  if (METRICS[metric].unit === "kg") return value * LB_PER_KG
  if (METRICS[metric].unit === "cm") return value * IN_PER_CM
  return value
}

export function unitLabel(metric: MetricId, system: UnitSystem) {
  const unit = system === "imperial" ? METRICS[metric].imperial : METRICS[metric].unit
  return unit === "score" ? "/10" : unit
}

/** "92.4 kg", "203.7 lb", "7/10". */
export function formatValue(metric: MetricId, value: number, system: UnitSystem) {
  const shown = fromCanonical(metric, value, system)
  const unit = unitLabel(metric, system)
  const rounded = Math.round(shown * 10) / 10
  return unit === "/10" ? `${rounded}/10` : `${rounded} ${unit}`
}

/** "−5.2%" for weight and waist, "−2.0 points" for scores. Uses a true minus sign. */
export function formatChange(change: "percent" | "points", value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : ""
  const magnitude = Math.abs(value).toFixed(1)
  return change === "percent" ? `${sign}${magnitude}%` : `${sign}${magnitude} ${Math.abs(value) === 1 ? "point" : "points"}`
}

export function changeFrom(metric: MetricId, baseline: number, value: number) {
  if (METRICS[metric].change === "points") return value - baseline
  return baseline ? ((value - baseline) / baseline) * 100 : 0
}
