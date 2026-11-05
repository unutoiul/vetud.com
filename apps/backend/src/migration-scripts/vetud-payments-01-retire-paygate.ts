import type { ExecArgs } from "@medusajs/framework/types"
import retirePaygate from "../scripts/retire-paygate"

export default async function retirePaygateCheckout(args: ExecArgs) {
  await retirePaygate(args)
}
