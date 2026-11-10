import type { MedusaContainer } from "@medusajs/framework/types"
import { importResearchPenKitsWorkflow } from "../workflows/import-research-pen-kits"

/** Imports the three supplied 40 mg pen kits on existing and newly seeded databases. */
export default async function vetudResearchPenKits({
  container,
}: {
  container: MedusaContainer
}) {
  await importResearchPenKitsWorkflow(container).run({ input: {} })
}
