import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { renameDualChamberVialWorkflow } from "../workflows/rename-dual-chamber-vial"

/** Run with `npx medusa exec ./src/scripts/rename-dual-chamber-vial.ts`; safe to repeat. */
export default async function renameDualChamberVial({ container }: ExecArgs) {
  const { result } = await renameDualChamberVialWorkflow(container).run({ input: {} })
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`DUAL_CHAMBER_VIAL_RENAMED ${JSON.stringify(result)}`)
}
