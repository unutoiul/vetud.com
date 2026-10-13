import type { ExecArgs } from "@medusajs/framework/types"
import { configureMajorMarketsWorkflow } from "../workflows/configure-major-markets"

export default async function configureMajorMarkets({ container }: ExecArgs) {
  await configureMajorMarketsWorkflow(container).run({ input: {} })
}
