import type { AuthenticatedMedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { NMI_PROVIDER_ID } from "../lib/nmi-config"
import { prepareNmiSessionWorkflow } from "../workflows/prepare-nmi-session"

export async function prepareNmiSession(
  req: AuthenticatedMedusaRequest<{ provider_id: string; data?: Record<string, unknown> }>,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  if (req.body.provider_id !== NMI_PROVIDER_ID) return next()
  try {
    const { result } = await prepareNmiSessionWorkflow(req.scope).run({ input: {
      payment_collection_id: req.params.id,
      customer_id: req.auth_context?.actor_id,
      data: req.body.data,
    } })
    req.body.data = result
    req.validatedBody = req.body
    next()
  } catch (error) {
    next(error)
  }
}
