import type { MedusaContainer } from "@medusajs/framework/types"
import { restoreUkPoundRegion } from "../lib/uk-pound-region"

/** Moves the United Kingdom from the euro region into the GBP region, so UK visitors see pounds. */
export default async function vetudUkPounds({ container }: { container: MedusaContainer }) {
  await restoreUkPoundRegion(container)
}
