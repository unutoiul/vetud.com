import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SHIPPING } from "../seed/catalog"
import { updateShippingRatesWorkflow } from "../workflows/update-shipping-rates"

/**
 * Runs once during deploy (owner's request, 2026-11-04): US standard delivery goes from $9.95 to
 * $24.95 and express from $24.95 to $50. Free shipping over a cart total and other currencies are
 * left as they are. Later changes can be made in Admin > Settings > Locations & Shipping.
 */
export default async function usShippingRates({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { result } = await updateShippingRatesWorkflow(container).run({
    input: { currency_code: "usd", rates: { standard: SHIPPING.standard, express: SHIPPING.express } },
  })
  for (const change of result) logger.info(`Shipping: ${change.option} ${change.from} → ${change.to} USD`)
}
