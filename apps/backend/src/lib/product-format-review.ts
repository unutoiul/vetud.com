/** Supplier sterility, endotoxin and cartridge-compatibility records were unavailable at review. */
export const PRODUCT_FORMAT_REVIEW = "research-formats-2026-11-09-v2-optional-accessories"
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
  return format === "Vial" || (format === "Nasal spray" && (NASAL_RESEARCH_HANDLES as readonly string[]).includes(handle))
}

export function reviewedResearchDescription(handle: string, description: string) {
  const about = handle === "bacteriostatic-water"
    ? "Water-based laboratory research diluent with a bacteriostatic preservative. Check the supplied label for composition and storage instructions."
    : description
    .split(/\n\s*\n/)
    .filter(paragraph => !/^(Supplied as (a research ingredient|sealed research material)|Supplied in a bottle|Available as a research vial)/.test(paragraph))
    .join("\n\n")
    .replace(/Choose a dual-chamber pen, with the powder and bacteriostatic water kept in separate chambers of one cartridge, or a vial of freeze-dried powder\.?/g, "")
    .replace(/Supplied for laboratory research use only\. Not for human or veterinary use\./g, "")
    .trim()
  const supply = handle === "decapeptide-12"
    ? "Supplied as a research ingredient for laboratory evaluation of topical formulations. Not a finished skincare product and not for injection."
    : handle === "bacteriostatic-water"
      ? "Supplied in a bottle for laboratory research. No pen or cartridge is included."
      : (NASAL_RESEARCH_HANDLES as readonly string[]).includes(handle)
        ? "Available as a research vial or nasal-spray format. No injection pen or dual-chamber cartridge is included."
        : "Supplied as sealed research material in a glass vial. No diluent, pen or needles are included."
  return `${about}\n\n${supply} For laboratory research only. Not for human or veterinary use.`
}
