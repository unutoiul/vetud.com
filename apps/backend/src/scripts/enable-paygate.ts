import { MedusaError } from "@medusajs/framework/utils"

/** Kept as an explicit failure for old deployment/runbook commands. */
export default async function enablePaygate() {
  throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "PayGate checkout has been retired and cannot be enabled.")
}
