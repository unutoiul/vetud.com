import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateStoresWorkflow } from "@medusajs/medusa/core-flows"
import { BASE_CURRENCY } from "../lib/currencies"
import { syncCurrencyPrices } from "../workflows/sync-currency-prices"

/**
 * Runs once during deploy (owner's request, 2026-11-04). USD becomes the store's default currency
 * and the only price that is set by hand. Every other currency, for products and shipping, is
 * converted from it at the current rate, and shipping costs the same USD amount in every country.
 * The hourly job (jobs/sync-currency-prices.ts) keeps it that way. This replaces the
 * @kb0912/currency-exchange-plugin, which converted product prices from EUR.
 */
export default async function usdBaseCurrency({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({ entity: "store", fields: ["id", "supported_currencies.currency_code", "supported_currencies.is_default"] })
  const store = stores[0]
  const supported = (store?.supported_currencies ?? []).flatMap((currency) => (currency ? [currency] : []))
  if (store && !supported.some((currency) => currency.currency_code === BASE_CURRENCY && currency.is_default)) {
    const codes = [...new Set([BASE_CURRENCY, ...supported.map((currency) => currency.currency_code)])]
    await updateStoresWorkflow(container).run({
      input: { selector: { id: store.id }, update: { supported_currencies: codes.map((currency_code) => ({ currency_code, is_default: currency_code === BASE_CURRENCY })) } },
    })
    logger.info("Currency prices: USD is now the store's default currency.")
  }
  try {
    await syncCurrencyPrices(container)
  } catch (error) {
    // Don't block the deploy; the hourly job converts the prices once the rates are reachable.
    logger.warn(`Currency prices: not converted during deploy (${(error as Error).message}).`)
  }
}
