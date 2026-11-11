import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { paygateCheckoutWorkflow } from "../../../../workflows/paygate-checkout"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("Referrer-Policy", "no-referrer")
  const { result } = await paygateCheckoutWorkflow(req.scope).run({ input: { session_id: req.params.id, token: typeof req.query.token === "string" ? req.query.token : "" } })
  res.redirect(303, result.url)
}
