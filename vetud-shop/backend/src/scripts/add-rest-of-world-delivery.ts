import type { ExecArgs } from "@medusajs/framework/types"
import { addRestOfWorldDeliveryWorkflow } from "../workflows/add-rest-of-world-delivery"

/** Run with `npx medusa exec ./src/scripts/add-rest-of-world-delivery.ts`; safe to repeat. */
export default async function addRestOfWorldDelivery({ container }: ExecArgs) {
  await addRestOfWorldDeliveryWorkflow(container).run({ input: {} })
}
