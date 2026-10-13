import type { MedusaContainer } from "@medusajs/framework/types"
import { priceResearchPenKitsWorkflow } from "../workflows/price-research-pen-kits"

/** Applies the researched US prices and additional amounts after the pen kit import. */
export default async function vetudResearchPenKitPrices({
  container,
}: {
  container: MedusaContainer
}) {
  await priceResearchPenKitsWorkflow(container).run({ input: {} })
}
