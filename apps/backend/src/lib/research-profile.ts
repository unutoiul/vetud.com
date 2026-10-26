import { MedusaError } from "@medusajs/framework/utils"

/**
 * Research profile required to place an order (see apps/storefront/src/lib/research.ts, which
 * collects it at checkout; keep the field list and acknowledgment version in sync).
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

export const RUO_ACK_VERSION = "2026-10"

export type CartForResearchCheck = {
  customer_id?: string | null
  metadata?: Record<string, unknown> | null
  shipping_address?: { company?: string | null } | null
}

/**
 * Throws unless the cart belongs to the signed-in customer and carries a complete research profile.
 * There is no guest checkout: `customerId` is the authenticated customer, never taken from the cart.
 */
export function validateResearchProfile(cart: CartForResearchCheck, customerId: string | undefined | null) {
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Sign in to your account to place an order.")
  }
  if (cart.customer_id !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "This cart does not belong to your account. Return to checkout and try again.")
  }

  const metadata = cart.metadata ?? {}
  const company = typeof metadata.company_name === "string" ? metadata.company_name.trim() : ""
  if (!company || !cart.shipping_address?.company?.trim()) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "A company or institution name is required to place an order.")
  }
  if (!RESEARCH_FIELDS.includes(metadata.research_field as (typeof RESEARCH_FIELDS)[number])) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Choose your field of research to place an order.")
  }
  if (metadata.ruo_acknowledged !== true || metadata.ruo_ack_version !== RUO_ACK_VERSION) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You must confirm that the products are for laboratory research purposes only, and not for human therapeutic use, to place an order."
    )
  }
}
