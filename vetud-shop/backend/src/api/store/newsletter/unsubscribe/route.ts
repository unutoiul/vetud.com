import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { removeShopContact } from "../../../../lib/resend-contacts"
import { unsubscribeNewsletterWorkflow } from "../../../../workflows/newsletter"
import type { StoreNewsletterUnsubscribeBody } from "../validators"

export async function POST(req: MedusaRequest<StoreNewsletterUnsubscribeBody>, res: MedusaResponse) {
  await unsubscribeNewsletterWorkflow(req.scope).run({ input: req.validatedBody })
  res.json({ success: true })

  // Also out of the Resend segment, so broadcasts stop too. If Resend fails, the hourly sync
  // (jobs/sync-newsletter-to-resend.ts) removes them later.
  const address = req.validatedBody.email.trim().toLowerCase()
  removeShopContact(address).catch((error: unknown) => {
    const reason = error instanceof Error ? error.message : String(error)
    req.scope.resolve(ContainerRegistrationKeys.LOGGER).error(`Resend unsubscribe for ${address} failed: ${reason}`)
  })
}
