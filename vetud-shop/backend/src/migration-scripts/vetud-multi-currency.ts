import type { MedusaContainer } from "@medusajs/framework/types"
import { ensureEuropeanMarkets } from "../seed/european-markets"

/**
 * Runs once per database during `medusa db:migrate`: adds all eurozone countries and the
 * GBP, CHF, SEK, NOK, DKK, PLN, CZK, HUF, RON and ISK regions, and turns on automatic price
 * conversion in the currency plugin.
 */
export default async function vetudMultiCurrency({ container }: { container: MedusaContainer }) {
  await ensureEuropeanMarkets(container)
}
