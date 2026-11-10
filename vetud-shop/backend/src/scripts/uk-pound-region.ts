import type { ExecArgs } from "@medusajs/framework/types"
import { restoreUkPoundRegion } from "../lib/uk-pound-region"

/** Runs only this change, for example locally: `npx medusa exec ./src/scripts/uk-pound-region.ts`. */
export default async function ukPoundRegion({ container }: ExecArgs) {
  await restoreUkPoundRegion(container)
}
