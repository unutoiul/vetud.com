import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { refreshProductQualityWorkflow } from "../workflows/refresh-product-quality"

export default async function refreshProductQuality({ container }: ExecArgs) {
  const { result } = await refreshProductQualityWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(
      `Product quality copy refreshed: ${result.updated.join(", ") || "already current"}`,
    )
}
