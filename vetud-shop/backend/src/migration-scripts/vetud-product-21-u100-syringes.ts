import type { ExecArgs } from "@medusajs/framework/types"
import importLabSupplies from "../scripts/import-lab-supplies"

/** Runs once during deploy: publishes the U-100 syringes (box of 10) on the Laboratory supplies shelf. */
export default async function u100Syringes(args: ExecArgs) {
  await importLabSupplies(args)
}
