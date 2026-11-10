import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { setupResearchCategoriesWorkflow } from "../workflows/setup-research-categories"

export default async function setupResearchCategories({ container }: ExecArgs) {
  const { result } = await setupResearchCategoriesWorkflow(container).run({ input: {} })
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`Research categories: ${JSON.stringify(result)}`)
}
