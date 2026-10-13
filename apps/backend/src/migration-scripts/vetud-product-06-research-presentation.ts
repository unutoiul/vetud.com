import type { MedusaContainer } from "@medusajs/framework/types"
import { refreshResearchProductPresentationWorkflow } from "../workflows/refresh-research-product-presentation"

export default async function vetudResearchPresentation({
  container,
}: {
  container: MedusaContainer
}) {
  await refreshResearchProductPresentationWorkflow(container).run({ input: {} })
}
