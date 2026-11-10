import type { ExecArgs } from "@medusajs/framework/types"
import { retirePaygateWorkflow } from "../workflows/retire-paygate"

export default async function retirePaygate({ container }: ExecArgs) {
  const { result } = await retirePaygateWorkflow(container).run({ input: {} })
  console.log(JSON.stringify({ action: "retire-paygate", changedRegions: result.length, regions: result }))
}
