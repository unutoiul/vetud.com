import type { MedusaContainer } from "@medusajs/framework/types"
import { unpublishHumanUseProductsWorkflow } from "../workflows/unpublish-human-use-products"

/**
 * Sets the pen kits and nasal sprays to draft so the storefront only lists research materials.
 * Reversible in Admin (Products > the product > Status > Published).
 */
export default async function vetudUnpublishHumanUseProducts({
  container,
}: {
  container: MedusaContainer
}) {
  await unpublishHumanUseProductsWorkflow(container).run({ input: {} })
}
