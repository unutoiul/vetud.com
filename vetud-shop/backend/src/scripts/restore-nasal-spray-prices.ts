import type { ExecArgs } from "@medusajs/framework/types"
import { restoreNasalSprayPricesWorkflow } from "../workflows/restore-nasal-spray-prices"

export default async function restoreOriginalNasalPrices({
  container,
}: ExecArgs) {
  const { result } = await restoreNasalSprayPricesWorkflow(container).run({
    input: {},
  })
  console.log(JSON.stringify(result))
}
