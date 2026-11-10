import type { ExecArgs } from "@medusajs/framework/types"
import renameNasalSprayFormat from "../scripts/rename-nasal-spray-format"

/**
 * Runs once during deploy, after the dual-chamber vial rename: Selank and Semax sell a "Nasal spray"
 * in place of the "Pen kit box", with what it includes. Prices and SKUs stay as they are.
 */
export default async function nasalSprayFormat(args: ExecArgs) {
  await renameNasalSprayFormat(args)
}
