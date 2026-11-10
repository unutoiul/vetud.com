import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { importLabSuppliesWorkflow } from "../workflows/import-lab-supplies"

/** Run with `npx medusa exec ./src/scripts/import-lab-supplies.ts`; safe to repeat. */
export default async function importLabSupplies({ container }: ExecArgs) {
  const { result } = await importLabSuppliesWorkflow(container).run({ input: {} })
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`LAB_SUPPLIES ${JSON.stringify(result)}`)
}
