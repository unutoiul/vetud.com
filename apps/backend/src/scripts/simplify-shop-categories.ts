import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { simplifyShopCategoriesWorkflow } from "../workflows/simplify-shop-categories"

export default async function simplifyShopCategories({ container }: ExecArgs) {
  const { result } = await simplifyShopCategoriesWorkflow(container).run({ input: {} })
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`Shop categories: ${JSON.stringify(result)}`)
}
