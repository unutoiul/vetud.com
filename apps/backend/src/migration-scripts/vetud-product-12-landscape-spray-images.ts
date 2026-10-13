import type { ExecArgs } from "@medusajs/framework/types"
import { refreshNasalSprayImagesWorkflow } from "../workflows/refresh-nasal-spray-images"

export default async function refreshLandscapeSprayImages({
  container,
}: ExecArgs) {
  await refreshNasalSprayImagesWorkflow(container).run({ input: {} })
}
