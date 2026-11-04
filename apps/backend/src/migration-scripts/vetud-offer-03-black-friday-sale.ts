import type { ExecArgs } from "@medusajs/framework/types"
import switchToBlackFridaySale from "../scripts/switch-to-black-friday-sale"

/** Runs once during deploy: the 30% Black Friday sale replaces the winter offer, with no sign-up codes. */
export default async function blackFridaySale(args: ExecArgs) {
  await switchToBlackFridaySale(args)
}
