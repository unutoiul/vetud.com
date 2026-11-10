import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readSaleSettings, saleState } from "../../../lib/storewide-sale"
import { createStorewideSaleWorkflow } from "../../../workflows/storewide-sale"
import type { AdminCreateStorewideSaleType } from "./validators"

/** The sales Admin > Sales manages (price lists with a percentage), newest first. */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "price_list",
    fields: ["id", "title", "status", "starts_at", "ends_at", "created_at", "metadata"],
    filters: { type: "sale" },
    pagination: { order: { created_at: "DESC" } },
  })
  const sales = data.flatMap((list) => {
    const settings = readSaleSettings(list.metadata)
    if (!settings) return []
    return [{
      id: list.id,
      title: list.title,
      percent_off: settings.percent_off,
      status: list.status,
      starts_at: list.starts_at,
      ends_at: list.ends_at,
      created_at: list.created_at,
      state: saleState(list),
    }]
  })
  res.json({ sales })
}

export async function POST(req: AuthenticatedMedusaRequest<AdminCreateStorewideSaleType>, res: MedusaResponse) {
  const { result } = await createStorewideSaleWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ id: result.id, prices: result.prices })
}
