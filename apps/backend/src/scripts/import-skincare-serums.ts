import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import syncStorewideSales from "../jobs/sync-storewide-sales"
import { importSkincareSerumsWorkflow } from "../workflows/import-skincare-serums"
import { syncCurrencyPrices } from "../workflows/sync-currency-prices"

/**
 * Run with `npx medusa exec ./src/scripts/import-skincare-serums.ts`; safe to repeat. Adds the
 * Anua serums, then converts their USD price into the other currencies straight away (instead of
 * at the next hourly job) and recalculates the running sale, which leaves them at full price.
 */
export default async function importSkincareSerums({ container }: ExecArgs, { syncPrices = true } = {}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { result } = await importSkincareSerumsWorkflow(container).run({ input: {} })
  if (syncPrices && result.created.length) {
    await syncCurrencyPrices(container)
    await syncStorewideSales(container)
  }
  logger.info(`SKINCARE_SERUMS ${JSON.stringify(result)}`)
}
