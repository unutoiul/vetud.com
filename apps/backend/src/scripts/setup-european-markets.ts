import type { ExecArgs } from "@medusajs/framework/types"
import { ensureEuropeanMarkets } from "../seed/european-markets"

/**
 * Manual entry point: `npm run markets:setup`. Re-runs the European currency setup, e.g. if the
 * exchange-rate API was unreachable during the migration. Safe to run any time.
 */
export default async function setupEuropeanMarkets({ container }: ExecArgs) {
  await ensureEuropeanMarkets(container)
}
