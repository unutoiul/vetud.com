/** Product-specific temperatures, freezing suitability and shelf life await manufacturer data. */
export const PRODUCT_QUALITY_REVISION = "lab-purity-and-care-2026-10-13-v1"
export const PRODUCT_TESTING_LABEL = "Lab tested for purity"
export const PRODUCT_STORAGE_GUIDANCE =
  "Follow the manufacturer's batch-specific storage temperature and conditions."
export const PRODUCT_STABILITY_GUIDANCE =
  "Refer to the batch expiry date and the manufacturer's stability data."
export const PRODUCT_HANDLING_GUIDANCE =
  "Keep in original packaging, away from direct sunlight and excess heat."
export const PRODUCT_CARE_DESCRIPTION =
  "Storage and stability: Follow the manufacturer's batch-specific temperature instructions and expiry date. Keep in original packaging, away from direct sunlight and excess heat."

export const PEN_FEATURES = [
  "Freeze-dried peptide",
  "Dual-chamber pen",
  "Separate BAC water",
]
export const PEN_FORM = "Dual-chamber pen kit"
export const PEN_STABILITY_GUIDANCE =
  "Freeze-dried powder and BAC water remain in separate chambers until preparation. See the batch expiry date for shelf life."
export function penIngredients(title: string) {
  return `${title} peptide powder; bacteriostatic water (BAC water) in a separate chamber. Refer to the manufacturer's batch specification for the complete formulation.`
}
export function penDescription(title: string) {
  return `VETUD ${title} is supplied as freeze-dried peptide powder in a dual-chamber pen. One chamber holds the powder and the other holds bacteriostatic water (BAC water), keeping them separate until preparation. Available in 10 mg, 20 mg and 40 mg total peptide amounts.\n\n99% purity. ${PRODUCT_TESTING_LABEL}. Each kit includes one pen, 12 disposable needles and an instruction booklet. Photos show the 40 mg kit across all sizes.\n\nIngredients: ${penIngredients(title)}\n\n${PRODUCT_CARE_DESCRIPTION} ${PEN_STABILITY_GUIDANCE}\n\nFor research use only.`
}
