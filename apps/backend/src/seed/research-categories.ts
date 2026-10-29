export const BEAUTY_CATEGORY = {
  name: "Beauty",
  handle: "beauty",
  description: "Research materials grouped for investigation of skin and pigmentation biology.",
} as const

/** Research taxonomy requested by the store owner. Editable in Medusa Admin after setup. */
export const RESEARCH_CATEGORIES = [
  { name: "Healing and Regeneration Research", handle: "healing-regeneration-research", description: "Materials for laboratory investigation of tissue repair and regenerative pathways." },
  { name: "Immunity Enhancement Research", handle: "immunity-enhancement-research", description: "Materials for laboratory investigation of immune signalling and immune-response pathways." },
  { name: "Longevity and Anti-aging Research", handle: "longevity-anti-aging-research", description: "Materials for laboratory investigation of cellular ageing and longevity-related pathways." },
  { name: "Reproductive Health Research", handle: "reproductive-health-research", description: "Materials for laboratory investigation of reproductive biology and related signalling pathways." },
  { name: "Sleep Enhancement Research", handle: "sleep-enhancement-research", description: "Materials for laboratory investigation of sleep regulation and circadian pathways." },
  { name: "Weight Loss Research", handle: "weight-loss-research", description: "Materials for laboratory investigation of metabolic, appetite and body-weight regulation pathways." },
  { name: "Cognitive Enhancement Research", handle: "cognitive-enhancement-research", description: "Materials for laboratory investigation of neuronal signalling and cognition-related pathways." },
  { name: "Muscle Growth Research", handle: "muscle-growth-research", description: "Materials for laboratory investigation of muscle biology and growth-related signalling pathways." },
  BEAUTY_CATEGORY,
] as const

/** Classify only identified materials; generic placeholder products remain in their existing categories. */
export const RESEARCH_CATEGORY_ASSIGNMENTS: Record<string, string[]> = {
  retatrutide: ["weight-loss-research"],
  tirzepatide: ["weight-loss-research"],
  semaglutide: ["weight-loss-research"],
  selank: ["cognitive-enhancement-research"],
  semax: ["cognitive-enhancement-research"],
  "nad-plus": ["longevity-anti-aging-research"],
  melanotan: ["beauty"],
  ipamorelin: ["muscle-growth-research"],
}
