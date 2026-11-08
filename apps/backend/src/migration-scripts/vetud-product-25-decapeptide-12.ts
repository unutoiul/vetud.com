import type { ExecArgs } from "@medusajs/framework/types"
import addDecapeptide12 from "../scripts/add-decapeptide-12"

/**
 * Runs once during deploy: adds Decapeptide-12 200 mg (owner request 2026-11-09) as a dual-chamber
 * vial, a vial and a pen kit box. Where the product already exists (it was added in production with
 * the script), nothing changes. Prices for the other currencies and the sale follow from the
 * hourly and 15-minute jobs.
 */
export default async function decapeptide12(args: ExecArgs) {
  await addDecapeptide12(args, { syncPrices: false, strict: false })
}
