import type { ExecArgs } from "@medusajs/framework/types"
import importSkincareSerums from "../scripts/import-skincare-serums"

/**
 * Runs once during deploy: publishes the Anua Azelaic Acid 10 + Hyaluron and Niacinamide 10 + TXA 4
 * serums (owner request 2026-11-09), 30 ml at $25, outside the storewide sale. Other currencies
 * follow from the hourly price job.
 */
export default async function anuaSerums(args: ExecArgs) {
  await importSkincareSerums(args, { syncPrices: false })
}
