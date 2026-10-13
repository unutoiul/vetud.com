import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { pricePremiumProductsWorkflow } from "../workflows/price-premium-products"

export default async function pricePremiumProducts({ container }: ExecArgs) {
  const { result } = await pricePremiumProductsWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(`Premium retail prices: ${JSON.stringify(result)}`)
}
