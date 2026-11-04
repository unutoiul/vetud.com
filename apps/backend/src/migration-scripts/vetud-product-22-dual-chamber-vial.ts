import type { ExecArgs } from "@medusajs/framework/types"
import renameDualChamberVial from "../scripts/rename-dual-chamber-vial"

/**
 * Runs once during deploy, after the Pen kit box: renames the "Dual-chamber pen" format to
 * "Dual-chamber vial" (the cartridge on its own) and updates what it and the Pen kit box include.
 * Prices and SKUs stay as they are.
 */
export default async function dualChamberVial(args: ExecArgs) {
  await renameDualChamberVial(args)
}
