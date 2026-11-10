import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { readSaleSettings, saleState } from "../lib/storewide-sale"
import { syncStorewideSaleWorkflow } from "../workflows/storewide-sale"

/**
 * Keeps every sale that hasn't ended in line with the catalog: products added and regular prices
 * changed since the sale was saved get their sale price within 15 minutes.
 */
export default async function syncStorewideSales(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "price_list",
    fields: ["id", "status", "starts_at", "ends_at", "metadata"],
    filters: { type: "sale" },
  })
  const sales = data.filter((list) => readSaleSettings(list.metadata) && saleState(list) !== "ended")
  for (const sale of sales) {
    try {
      const { result } = await syncStorewideSaleWorkflow(container).run({ input: { id: sale.id } })
      if (result.created + result.updated + result.deleted) {
        logger.info(`Sale ${sale.id}: ${result.created} prices added, ${result.updated} updated, ${result.deleted} removed`)
      }
    } catch (error) {
      logger.error(`Couldn't recalculate sale ${sale.id}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export const config = {
  name: "sync-storewide-sales",
  schedule: "*/15 * * * *",
}
