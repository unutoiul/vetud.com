import type { MedusaContainer } from "@medusajs/framework/types"
import { initializePaypalWalletWorkflow } from "../workflows/initialize-paypal"

export default async function initializePayPal({ container }: { container: MedusaContainer }) {
  await initializePaypalWalletWorkflow(container).run({ input: undefined })
}
