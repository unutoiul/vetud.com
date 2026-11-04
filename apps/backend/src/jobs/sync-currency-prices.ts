import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncCurrencyPrices } from "../workflows/sync-currency-prices"

/**
 * Hourly: converts every USD price into the other store currencies at the current rate, and
 * gives shipping the same USD price in every country. USD prices edited in Admin reach the other
 * currencies within the hour. If the rates can't be fetched, the prices stay as they are.
 */
export default async function syncCurrencyPricesJob(container: MedusaContainer) {
  try {
    await syncCurrencyPrices(container)
  } catch (error) {
    container.resolve(ContainerRegistrationKeys.LOGGER).error(`Currency prices not updated: ${(error as Error).message}`)
  }
}

export const config = {
  name: "sync-currency-prices",
  schedule: "7 * * * *",
}
