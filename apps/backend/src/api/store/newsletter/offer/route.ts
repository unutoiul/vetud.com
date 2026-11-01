import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getActiveOffer } from "../../../../lib/newsletter"

/** The pop-up offer, without its code: the code is only ever sent by email. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const offer = await getActiveOffer(req.scope)
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ offer: offer ? { id: offer.promotion_id, headline: offer.headline, description: offer.description, discount: offer.discount, ends_at: offer.ends_at } : null })
}
