import type { ExecArgs } from "@medusajs/framework/types"
import { enablePaygateWorkflow } from "../workflows/enable-paygate"

export default async function enablePaygate({ container }: ExecArgs) {
  const { result } = await enablePaygateWorkflow(container).run({ input: {} })
  console.log(JSON.stringify({ action: "enable-paygate", changedRegions: result }))
}
