import type { ExecArgs } from "@medusajs/framework/types"
import { priceApprovedPenKitsWorkflow } from "../workflows/price-approved-pen-kits"

export default async function priceApprovedPenKits({ container }: ExecArgs) {
  const { result } = await priceApprovedPenKitsWorkflow(container).run({
    input: {},
  })
  console.log(JSON.stringify(result))
}
