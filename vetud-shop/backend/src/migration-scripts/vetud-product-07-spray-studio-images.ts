import type { MedusaContainer } from "@medusajs/framework/types"
import { refreshNasalSprayImagesWorkflow } from "../workflows/refresh-nasal-spray-images"

export default async function vetudSprayStudioImages({
  container,
}: {
  container: MedusaContainer
}) {
  await refreshNasalSprayImagesWorkflow(container).run({ input: {} })
}
