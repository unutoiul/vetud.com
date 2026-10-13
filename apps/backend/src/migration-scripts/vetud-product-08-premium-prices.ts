import type { MedusaContainer } from "@medusajs/framework/types"
import { pricePremiumProductsWorkflow } from "../workflows/price-premium-products"

export default async function vetudPremiumPrices({
  container,
}: {
  container: MedusaContainer
}) {
  await pricePremiumProductsWorkflow(container).run({ input: {} })
}
