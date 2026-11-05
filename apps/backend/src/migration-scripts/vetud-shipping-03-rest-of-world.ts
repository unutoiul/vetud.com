import type { ExecArgs } from "@medusajs/framework/types"
import addRestOfWorldDelivery from "../scripts/add-rest-of-world-delivery"

/** Runs once during deploy: Standard and Express delivery to every other country, at the same prices. */
export default async function restOfWorld(args: ExecArgs) {
  await addRestOfWorldDelivery(args)
}
