import type { ExecArgs } from "@medusajs/framework/types"
import setupWinterOffer from "../scripts/setup-winter-offer"

/** Runs once during deploy: starts the 20% winter sale and the 10% code for newsletter subscribers. */
export default async function winterOffer(args: ExecArgs) {
  await setupWinterOffer(args)
}
