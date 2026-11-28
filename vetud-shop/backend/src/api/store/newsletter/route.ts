import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addShopContact, CONTACT_SOURCES } from "../../../lib/resend-contacts"
import { subscribeNewsletterWorkflow } from "../../../workflows/newsletter"
import type { StoreNewsletterBody } from "./validators"

/** Sign-up from the storefront pop-up. The answer is the same whether or not the email was already known. */
export async function POST(req: MedusaRequest<StoreNewsletterBody>, res: MedusaResponse) {
  const { email, country_code, website } = req.validatedBody
  // A filled honeypot means a bot; pretend it worked.
  if (website) {
    res.status(201).json({ success: true })
    return
  }
  await subscribeNewsletterWorkflow(req.scope).run({ input: { email, country_code } })
  res.status(201).json({ success: true })

  // Also a Resend contact, for broadcasts. If Resend fails, the hourly sync
  // (jobs/sync-newsletter-to-resend.ts) adds them later.
  const address = email.trim().toLowerCase()
  addShopContact(address, CONTACT_SOURCES.shopPopup, { country: country_code, resubscribe: true }).catch(
    (error: unknown) => {
      const reason = error instanceof Error ? error.message : String(error)
      req.scope.resolve(ContainerRegistrationKeys.LOGGER).error(`Resend contact for ${address} failed: ${reason}`)
    },
  )
}
