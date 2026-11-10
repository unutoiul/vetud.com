import type { ExecArgs } from "@medusajs/framework/types"
import { priceApprovedPenKitsWorkflow } from "../workflows/price-approved-pen-kits"

export default async function applyApprovedPenPrices({ container }: ExecArgs) {
  await priceApprovedPenKitsWorkflow(container).run({ input: {} })
}
