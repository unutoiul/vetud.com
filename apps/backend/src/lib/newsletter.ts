import { createHmac, timingSafeEqual } from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

/** Customers who asked for offers by email are kept in this Medusa customer group. */
export const NEWSLETTER_GROUP = "Newsletter"

/** A campaign whose identifier starts with this is shown in the storefront sign-up pop-up. */
export const POPUP_CAMPAIGN_PREFIX = "popup-"

/** The exact wording the visitor ticked, stored with their consent. Change the version when the wording changes. */
export const CONSENT_TEXT = "Yes, email me VETUD offers and news. I can unsubscribe at any time."
export const CONSENT_VERSION = "2026-11"

export type NewsletterOffer = {
  promotion_id: string
  code: string
  headline: string
  description: string | null
  discount: string
  starts_at: string | null
  ends_at: string | null
}

type PromotionRow = {
  id: string
  code?: string | null
  is_automatic?: boolean | null
  application_method?: { type?: string | null; value?: number | null; currency_code?: string | null } | null
  campaign?: { name?: string | null; description?: string | null; campaign_identifier?: string | null; starts_at?: Date | string | null; ends_at?: Date | string | null } | null
}

const iso = (value?: Date | string | null) => (value ? new Date(value).toISOString() : null)

function discountLabel(method: PromotionRow["application_method"]) {
  const value = Number(method?.value ?? 0)
  return method?.type === "percentage" ? `${value}%` : `${value} ${(method?.currency_code ?? "").toUpperCase()}`.trim()
}

/**
 * The offer the pop-up advertises: an active, code-based promotion in a running campaign whose
 * identifier starts with "popup-". The one ending soonest wins. Configured entirely in Medusa Admin.
 */
export async function getActiveOffer(container: MedusaContainer): Promise<NewsletterOffer | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "promotion",
    fields: [
      "id", "code", "is_automatic",
      "application_method.type", "application_method.value", "application_method.currency_code",
      "campaign.name", "campaign.description", "campaign.campaign_identifier", "campaign.starts_at", "campaign.ends_at",
    ],
    filters: { status: "active" },
  })
  const now = Date.now()
  const candidates = (data as PromotionRow[]).filter((promotion) => {
    const campaign = promotion.campaign
    if (!promotion.code || promotion.is_automatic || !campaign?.campaign_identifier?.startsWith(POPUP_CAMPAIGN_PREFIX)) return false
    const starts = campaign.starts_at ? new Date(campaign.starts_at).getTime() : -Infinity
    const ends = campaign.ends_at ? new Date(campaign.ends_at).getTime() : Infinity
    return starts <= now && now < ends
  })
  candidates.sort((a, b) => (a.campaign?.ends_at ? new Date(a.campaign.ends_at).getTime() : Infinity) - (b.campaign?.ends_at ? new Date(b.campaign.ends_at).getTime() : Infinity))
  const promotion = candidates[0]
  if (!promotion?.code || !promotion.campaign) return null
  return {
    promotion_id: promotion.id,
    code: promotion.code,
    headline: promotion.campaign.name ?? "",
    description: promotion.campaign.description ?? null,
    discount: discountLabel(promotion.application_method),
    starts_at: iso(promotion.campaign.starts_at),
    ends_at: iso(promotion.campaign.ends_at),
  }
}

function secret() {
  const value = process.env.JWT_SECRET
  if (!value) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "JWT_SECRET is not set.")
  return value
}

/** Signed unsubscribe token for an email address, so links can't be forged for someone else. */
export function unsubscribeToken(email: string) {
  return createHmac("sha256", secret()).update(`newsletter:${email.trim().toLowerCase()}`).digest("base64url")
}

export function isValidUnsubscribeToken(email: string, token: string) {
  const expected = Buffer.from(unsubscribeToken(email))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
