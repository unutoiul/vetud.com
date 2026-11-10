import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { priceResearchPenKitsWorkflow } from "../workflows/price-research-pen-kits"

/** Run with `npx medusa exec ./src/scripts/price-research-pen-kits.ts`. */
export default async function priceResearchPenKits({ container }: ExecArgs) {
  const { result } = await priceResearchPenKitsWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(`Research pen kit US prices: ${JSON.stringify(result)}`)
}
