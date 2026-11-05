import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listDeliveryCountries } from "../../../lib/delivery-countries"

/** The countries checkout can deliver to (every delivery zone's countries), for the address forms. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "public, max-age=300")
  res.json({ countries: await listDeliveryCountries(req.scope) })
}
