import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { normalizeEmail } from "../../../../lib/email-list"
import { removeListContact } from "../../../../lib/resend-contacts"
import { unsubscribeEmailListWorkflow } from "../../../../workflows/email-list"
import type { StoreUnsubscribeEmailListBody } from "../validators"

export async function POST(req: MedusaRequest<StoreUnsubscribeEmailListBody>, res: MedusaResponse) {
  await unsubscribeEmailListWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ success: true })

  // Also out of the Resend email-list segment, so broadcasts stop too. If Resend fails, the hourly sync
  // (jobs/sync-email-list-to-resend.ts) removes them later.
  const email = normalizeEmail(req.validatedBody.email)
  removeListContact(email).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error)
    req.scope.resolve(ContainerRegistrationKeys.LOGGER).error(`Resend unsubscribe for ${email} failed: ${reason}`)
  })
}
