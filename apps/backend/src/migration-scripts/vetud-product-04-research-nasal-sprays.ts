import type { MedusaContainer } from "@medusajs/framework/types"
import { importResearchNasalSpraysWorkflow } from "../workflows/import-research-nasal-sprays"

/** Adds the Selank and Semax spray drafts with researched initial USD prices. */
export default async function vetudResearchNasalSprays({
  container,
}: {
  container: MedusaContainer
}) {
  await importResearchNasalSpraysWorkflow(container).run({ input: {} })
}
