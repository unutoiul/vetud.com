import type { ExecArgs } from "@medusajs/framework/types"
import refreshPlainProductCopy from "../scripts/refresh-plain-product-copy"

/** Runs once during deploy: the plain-language subtitles and descriptions of the pilot products. */
export default async function plainDescriptions(args: ExecArgs) {
  await refreshPlainProductCopy(args)
}
