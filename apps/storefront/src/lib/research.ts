import type { HttpTypes } from "@medusajs/types"

/**
 * Research-use acknowledgment stored on the cart (then the order) as metadata.
 * The backend re-checks it before an order can be created (apps/backend/src/lib/research-profile.ts);
 * keep the acknowledgment version in sync.
 */
/** Bump when the acknowledgment wording changes, so each order records which text was accepted. */
export const RUO_ACK_VERSION = "2026-10"

export const RUO_ACK_TEXT =
  "I confirm that I am a qualified researcher, or that I am purchasing for a research institution or company, and that the products I am ordering are for laboratory research purposes only. They will not be used for human therapeutic purposes, or for human or animal consumption, dosing or injection."

export function researchAcknowledgmentMetadata() {
  return {
    ruo_acknowledged: true,
    ruo_acknowledged_at: new Date().toISOString(),
    ruo_ack_version: RUO_ACK_VERSION,
  }
}

/** True when the current research-use wording has been accepted. */
export function hasResearchAcknowledgment(cart: HttpTypes.StoreCart) {
  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  return (
    metadata.ruo_acknowledged === true &&
    metadata.ruo_ack_version === RUO_ACK_VERSION
  )
}
