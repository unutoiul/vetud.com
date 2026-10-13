import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { importResearchPenKitsWorkflow } from "../workflows/import-research-pen-kits"

/** Run with `npx medusa exec ./src/scripts/import-research-pen-kits.ts`. */
export default async function importResearchPenKits({ container }: ExecArgs) {
  const { result } = await importResearchPenKitsWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(`Research pen kits: ${JSON.stringify(result)}`)
}
