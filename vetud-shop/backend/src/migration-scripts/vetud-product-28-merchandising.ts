import type { ExecArgs } from "@medusajs/framework/types"
import setupProductMerchandising from "../scripts/setup-product-merchandising"

/** Populate the owner's product labels once when this version is deployed. */
export default async function productMerchandising(args: ExecArgs) {
  await setupProductMerchandising(args)
}
