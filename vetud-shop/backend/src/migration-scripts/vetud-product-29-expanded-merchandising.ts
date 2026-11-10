import type { ExecArgs } from "@medusajs/framework/types"
import expandProductMerchandising from "../scripts/expand-product-merchandising"

/** Owner-requested expansion; also upgrades stores that already ran migration 28. */
export default async function expandedProductMerchandising(args: ExecArgs) {
  await expandProductMerchandising(args)
}
