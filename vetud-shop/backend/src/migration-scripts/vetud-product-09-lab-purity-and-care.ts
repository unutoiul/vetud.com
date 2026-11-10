import type { MedusaContainer } from "@medusajs/framework/types"
import { refreshProductQualityWorkflow } from "../workflows/refresh-product-quality"

export default async function vetudLabPurityAndCare({
  container,
}: {
  container: MedusaContainer
}) {
  await refreshProductQualityWorkflow(container).run({ input: {} })
}
