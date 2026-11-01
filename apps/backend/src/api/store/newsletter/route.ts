import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { subscribeNewsletterWorkflow } from "../../../workflows/newsletter"
import type { StoreNewsletterBody } from "./validators"

/** Sign-up from the storefront pop-up. The answer is the same whether or not the email was already known. */
export async function POST(req: MedusaRequest<StoreNewsletterBody>, res: MedusaResponse) {
  const { email, country_code, website } = req.validatedBody
  // A filled honeypot means a bot; pretend it worked.
  if (!website) await subscribeNewsletterWorkflow(req.scope).run({ input: { email, country_code } })
  res.status(201).json({ success: true })
}
