import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { refreshNasalSprayImagesWorkflow } from "../workflows/refresh-nasal-spray-images"

export default async function refreshNasalSprayImages({ container }: ExecArgs) {
  const { result } = await refreshNasalSprayImagesWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(
      `Spray studio images updated: ${result.updated.join(", ") || "already current"}`,
    )
}
