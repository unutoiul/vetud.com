import type { ExecArgs } from "@medusajs/framework/types"
import { configureThreeCurrenciesWorkflow } from "../workflows/configure-three-currencies"

/** Run with `npx medusa exec ./src/scripts/configure-three-currencies.ts`; safe to repeat. */
export default async function configureThreeCurrencies({ container }: ExecArgs) {
  await configureThreeCurrenciesWorkflow(container).run({ input: {} })
}
