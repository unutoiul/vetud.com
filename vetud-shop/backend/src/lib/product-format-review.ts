/** Product-specific exclusions only; packaging availability is not an injection certification. */
export const PRODUCT_FORMAT_REVIEW = "selective-formats-2026-11-09-v3"
export const RESEARCH_VIAL_CONTENTS = "One sealed glass vial of research material. No diluent, pen or needles are included. For laboratory research only; not for human or veterinary use."
export const NASAL_RESEARCH_HANDLES = ["selank", "semax"] as const
export const RESEARCH_WATER_SUBTITLE = "Water-based diluent with a bacteriostatic preservative, for laboratory research."
export const OPTIONAL_VIAL_ACCESSORIES_SCOPE = "optional-laboratory-vial"

/** Catalog accessory scope, not a certification of solvent compatibility or injection suitability. */
const OPTIONAL_ACCESSORY_HANDLES = new Set([
  "aod-9604", "ara-290", "bpc-157", "cjc-1295-ipamorelin", "dsip", "glutathione",
  "igf-1-lr3", "ipamorelin", "kpv", "melanotan-i", "melanotan-ii", "mots-c", "pt-141",
  "retatrutide", "selank", "semaglutide", "semax", "ss-31", "tb-500", "tesamorelin",
  "tirzepatide", "wolverine-blend",
])

export function optionalVialAccessoriesAllowed(handle: string) {
  return OPTIONAL_ACCESSORY_HANDLES.has(handle)
}

export function isUnverifiedInjectionFormat(format: string) {
  return /dual[ -]chamber|pen kit|injection pen/i.test(format)
}

export function catalogFormatAllowed(handle: string, format: string) {
  if (handle === "decapeptide-12") return format === "Vial"
  if (format === "Vial" || /dual[ -]chamber/i.test(format)) return true
  const nasal = (NASAL_RESEARCH_HANDLES as readonly string[]).includes(handle)
  if (format === "Nasal spray") return nasal
  return format === "Pen kit box" && !nasal && handle !== "bacteriostatic-water"
}

export function reviewedResearchDescription(handle: string, description: string) {
  if (handle !== "decapeptide-12") return description
  const about = description
    .split(/\n\s*\n/)
    .filter(paragraph => !/^(Supplied as (a research ingredient|sealed research material)|Supplied in a bottle|Available as a research vial)/.test(paragraph))
    .join("\n\n")
    .replace(/Choose a dual-chamber pen, with the powder and bacteriostatic water kept in separate chambers of one cartridge, or a vial of freeze-dried powder\.?/g, "")
    .replace(/Supplied for laboratory research use only\. Not for human or veterinary use\./g, "")
    .trim()
  const supply = "Supplied as a research ingredient for laboratory evaluation of topical formulations. Not a finished skincare product and not for injection."
  return `${about}\n\n${supply} For laboratory research only. Not for human or veterinary use.`
}
