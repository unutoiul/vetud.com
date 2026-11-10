import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readSaleSettings, saleState } from "../../../lib/storewide-sale"

/**
 * The sale running right now (Admin > Sales), for the storefront's announcement bar. When several
 * are live, the biggest discount wins, as it does at the till.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "price_list",
    fields: ["id", "title", "status", "starts_at", "ends_at", "metadata"],
    filters: { type: "sale", status: "active" },
  })
  const live = data
    .flatMap((list) => {
      const settings = readSaleSettings(list.metadata)
      return settings && saleState(list) === "live" ? [{ title: list.title, percent_off: settings.percent_off, ends_at: list.ends_at ? new Date(list.ends_at).toISOString() : null }] : []
    })
    .sort((a, b) => b.percent_off - a.percent_off)
  res.setHeader("Cache-Control", "public, max-age=60")
  res.json({ sale: live[0] ?? null })
}
