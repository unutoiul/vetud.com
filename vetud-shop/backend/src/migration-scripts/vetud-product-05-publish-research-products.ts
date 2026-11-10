import type { MedusaContainer } from "@medusajs/framework/types"
import { publishResearchProductsWorkflow } from "../workflows/publish-research-products"

/** Publishes the imported pen kits and sprays as requested. */
export default async function vetudPublishResearchProducts({
  container,
}: {
  container: MedusaContainer
}) {
  await publishResearchProductsWorkflow(container).run({ input: {} })
}
