import type { ExecArgs } from "@medusajs/framework/types"
import importSuppliedProducts from "../scripts/import-supplied-research-products"
import publishSuppliedProducts from "../scripts/publish-supplied-research-products"

/**
 * Runs once during deploy: adds the NAD+, Melanotan, Ipamorelin and Tesamorelin pen kits as drafts,
 * then publishes them with all regional prices and zero stock (shown as sold out until stock is
 * entered in Admin). Both scripts verify that no other product or stock level changed.
 */
export default async function publishSuppliedPenKits(args: ExecArgs) {
  await importSuppliedProducts(args)
  await publishSuppliedProducts(args)
}
