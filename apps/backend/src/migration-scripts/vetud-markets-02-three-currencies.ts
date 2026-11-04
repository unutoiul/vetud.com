import type { ExecArgs } from "@medusajs/framework/types"
import configureThreeCurrencies from "../scripts/configure-three-currencies"

/**
 * Runs once during deploy: USD for the United States, Canada and Australia, GBP for the UK, EUR for
 * the rest of Europe. Japan, China, Singapore, Hong Kong and the UAE are no longer sold to.
 */
export default async function threeCurrencies(args: ExecArgs) {
  await configureThreeCurrencies(args)
}
