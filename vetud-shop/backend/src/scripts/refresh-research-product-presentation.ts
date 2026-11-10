import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { refreshResearchProductPresentationWorkflow } from "../workflows/refresh-research-product-presentation"

export default async function refreshResearchProductPresentation({
  container,
}: ExecArgs) {
  const { result } = await refreshResearchProductPresentationWorkflow(
    container
  ).run({ input: {} })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(
      `Product presentation refreshed: ${result.map((product) => product.handle).join(", ")}`
    )
}
