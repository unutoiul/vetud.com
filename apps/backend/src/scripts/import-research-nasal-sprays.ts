import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { importResearchNasalSpraysWorkflow } from "../workflows/import-research-nasal-sprays"

/** Run with `npx medusa exec ./src/scripts/import-research-nasal-sprays.ts`. */
export default async function importResearchNasalSprays({
  container,
}: ExecArgs) {
  const { result } = await importResearchNasalSpraysWorkflow(container).run({
    input: {},
  })
  container
    .resolve(ContainerRegistrationKeys.LOGGER)
    .info(`Research nasal sprays: ${JSON.stringify(result)}`)
}
