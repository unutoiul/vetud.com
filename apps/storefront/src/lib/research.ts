import type { HttpTypes } from "@medusajs/types"

/**
 * Research profile collected at checkout and stored on the cart (then the order) as metadata.
 * The backend re-checks it before an order can be created (apps/backend/src/lib/research-profile.ts);
 * keep the two lists of fields and the acknowledgment version in sync.
 */
export const RESEARCH_FIELDS = [
  "Molecular Biology",
  "Biochemistry",
  "Peptide Chemistry",
  "Chemical Biology",
  "Biotechnology Research",
  "Cell Biology",
  "Analytical Chemistry",
  "Academic Research",
  "Other laboratory research",
] as const

/** Bump when the acknowledgment wording changes, so each order records which text was accepted. */
export const RUO_ACK_VERSION = "2026-10"

export const RUO_ACK_TEXT =
  "I confirm that I am a qualified researcher, or that I am purchasing for a research institution or company, and that the products I am ordering are for laboratory research purposes only. They will not be used for human therapeutic purposes, or for human or animal consumption, dosing or injection."

export type ResearchProfile = {
  research_field: string
  company_name: string
}

export function researchMetadata(profile: ResearchProfile) {
  return {
    research_field: profile.research_field,
    company_name: profile.company_name.trim(),
    ruo_acknowledged: true,
    ruo_acknowledged_at: new Date().toISOString(),
    ruo_ack_version: RUO_ACK_VERSION,
  }
}

/** True when the cart carries a complete research profile accepted under the current wording. */
export function hasResearchProfile(cart: HttpTypes.StoreCart) {
  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  return (
    RESEARCH_FIELDS.includes(metadata.research_field as (typeof RESEARCH_FIELDS)[number]) &&
    typeof metadata.company_name === "string" &&
    metadata.company_name.trim().length > 0 &&
    metadata.ruo_acknowledged === true &&
    metadata.ruo_ack_version === RUO_ACK_VERSION
  )
}
