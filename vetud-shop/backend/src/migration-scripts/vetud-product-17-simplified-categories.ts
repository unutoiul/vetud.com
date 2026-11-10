import type { ExecArgs } from "@medusajs/framework/types"
import simplifyShopCategories from "../scripts/simplify-shop-categories"

/** Runs once during deploy; the underlying workflow is also safe to run manually. */
export default async function renameShopCategories(args: ExecArgs) {
  await simplifyShopCategories(args)
}
